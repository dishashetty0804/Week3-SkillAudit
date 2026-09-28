# Database

`database/schema.sql` creates users, parking locations and slots, reservations, traffic records, prediction history, notifications, and audit logs. Reservation writes should lock the selected slot in a MySQL transaction (`SELECT ... FOR UPDATE`), verify availability and time overlap, then insert the reservation and update slot status. The current dependency-light local path uses the same domain model in memory; Docker initializes the durable schema.
