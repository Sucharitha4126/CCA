CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;

// Create or update users.
MERGE (u:User {id: $id})
SET u.email = $email, u.name = $name, u.risk = $risk;

// Create transaction relationship.
MATCH (s:User {id: $sender_id}), (r:User {id: $receiver_id})
CREATE (s)-[:SENT_MONEY {
  transaction_id: $transaction_id,
  amount: $amount,
  risk: $risk,
  created_at: datetime()
}]->(r);

// Detect cycles up to 4 hops.
MATCH cycle = (u:User)-[:SENT_MONEY*2..4]->(u)
RETURN cycle
LIMIT 25;

// Many-to-one pattern.
MATCH (sender:User)-[t:SENT_MONEY]->(receiver:User)
WITH receiver, count(DISTINCT sender) AS senders, sum(t.amount) AS volume
WHERE senders >= 3
RETURN receiver, senders, volume
ORDER BY senders DESC;

// One-to-many pattern.
MATCH (sender:User)-[t:SENT_MONEY]->(receiver:User)
WITH sender, count(DISTINCT receiver) AS receivers, sum(t.amount) AS volume
WHERE receivers >= 3
RETURN sender, receivers, volume
ORDER BY receivers DESC;
