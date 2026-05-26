from collections import Counter

import networkx as nx
from neo4j import GraphDatabase
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transaction import Transaction
from app.models.user import User


class GraphService:
    def __init__(self):
        self.driver = None
        if settings.NEO4J_URI and settings.NEO4J_PASSWORD:
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            )

    def sync_transaction(self, sender: User, receiver: User, transaction: Transaction):
        if not self.driver:
            return
        query = """
        MERGE (s:User {id: $sender_id})
        SET s.email = $sender_email, s.name = $sender_name
        MERGE (r:User {id: $receiver_id})
        SET r.email = $receiver_email, r.name = $receiver_name
        CREATE (s)-[:SENT_MONEY {transaction_id: $transaction_id, amount: $amount, risk: $risk}]->(r)
        """
        with self.driver.session() as session:
            session.run(
                query,
                sender_id=sender.id,
                sender_email=sender.email,
                sender_name=sender.name,
                receiver_id=receiver.id,
                receiver_email=receiver.email,
                receiver_name=receiver.name,
                transaction_id=transaction.id,
                amount=transaction.amount,
                risk=transaction.fraud_score,
            )

    def build_networkx_graph(self, db: Session) -> nx.DiGraph:
        graph = nx.DiGraph()
        users = db.query(User).all()
        for user in users:
            graph.add_node(user.id, name=user.name, email=user.email, risk=user.risk_score, frozen=user.is_frozen)
        for tx in db.query(Transaction).all():
            graph.add_edge(tx.sender_id, tx.receiver_id, amount=tx.amount, risk=tx.fraud_score, tx_id=tx.id)
        return graph

    def analyze(self, db: Session) -> dict:
        graph = self.build_networkx_graph(db)
        cycles = list(nx.simple_cycles(graph))
        in_degree = Counter(dict(graph.in_degree()))
        out_degree = Counter(dict(graph.out_degree()))
        centrality = nx.degree_centrality(graph) if graph.number_of_nodes() else {}
        suspicious_nodes = [
            node for node, score in centrality.items()
            if score > 0.35 or in_degree[node] >= 3 or out_degree[node] >= 3
        ]
        return {
            "cycles": cycles[:12],
            "suspicious_nodes": suspicious_nodes,
            "centrality": centrality,
            "node_count": graph.number_of_nodes(),
            "edge_count": graph.number_of_edges(),
        }

    def visualization_payload(self, db: Session) -> dict:
        graph = self.build_networkx_graph(db)
        analysis = self.analyze(db)
        cycle_nodes = {node for cycle in analysis["cycles"] for node in cycle}
        nodes = [
            {
                "id": str(node),
                "name": data.get("name"),
                "risk": data.get("risk", 0),
                "suspicious": node in analysis["suspicious_nodes"] or node in cycle_nodes,
                "frozen": data.get("frozen", False),
            }
            for node, data in graph.nodes(data=True)
        ]
        links = [
            {
                "source": str(source),
                "target": str(target),
                "amount": data.get("amount", 0),
                "risk": data.get("risk", 0),
                "suspicious": source in cycle_nodes and target in cycle_nodes,
            }
            for source, target, data in graph.edges(data=True)
        ]
        return {"nodes": nodes, "links": links, "analysis": analysis}


graph_service = GraphService()
