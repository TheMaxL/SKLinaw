-- Drop existing tables first (to avoid conflicts)
DROP TABLE IF EXISTS ProjectRatings CASCADE;
DROP TABLE IF EXISTS ProjectComments CASCADE;
DROP TABLE IF EXISTS Feedback CASCADE;
DROP TABLE IF EXISTS CommitteeMembers CASCADE;
DROP TABLE IF EXISTS Projects CASCADE;
DROP TABLE IF EXISTS CommitteeBudget CASCADE;
DROP TABLE IF EXISTS Expenses CASCADE;
DROP TABLE IF EXISTS Budget CASCADE;
DROP TABLE IF EXISTS Committees CASCADE;
DROP TABLE IF EXISTS Councilors CASCADE;
DROP TABLE IF EXISTS Developer CASCADE;
DROP TABLE IF EXISTS PendingAccounts CASCADE;
DROP TABLE IF EXISTS ArchivedCouncilors CASCADE;
DROP TABLE IF EXISTS Verified CASCADE;

-- Create tables in correct order (no foreign key issues)
CREATE TABLE IF NOT EXISTS Councilors (
    Name TEXT NOT NULL,
    Password TEXT NOT NULL,
    Barangay TEXT NOT NULL,
    approved INTEGER DEFAULT 0,
    privilege TEXT NULL
);

CREATE TABLE IF NOT EXISTS Developer (
    id SERIAL PRIMARY KEY,
    Name TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    approved INTEGER DEFAULT 1,
    privilege TEXT DEFAULT 'ADMIN'
);

CREATE TABLE IF NOT EXISTS Committees (
    name TEXT NOT NULL,
    barangay TEXT NOT NULL,
    head_name TEXT,
    PRIMARY KEY (name, barangay)
);

CREATE TABLE IF NOT EXISTS Projects (
    id SERIAL PRIMARY KEY,
    project_name TEXT NOT NULL,
    purpose TEXT,
    committee_name TEXT NOT NULL,
    barangay TEXT NOT NULL,
    councilor_name TEXT NOT NULL,
    total_cost REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rejection_reason TEXT NULL,
    approved_by TEXT NULL,
    approved_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS Budget (
    barangay TEXT PRIMARY KEY,
    total_budget REAL NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CommitteeBudget (
    barangay TEXT NOT NULL,
    committee_name TEXT NOT NULL,
    allocated_amount REAL NOT NULL,
    PRIMARY KEY (barangay, committee_name)
);

CREATE TABLE IF NOT EXISTS CommitteeMembers (
    id SERIAL PRIMARY KEY,
    committee_name TEXT NOT NULL,
    barangay TEXT NOT NULL,
    councilor_name TEXT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(committee_name, barangay, councilor_name)
);

CREATE TABLE IF NOT EXISTS Expenses (
    id SERIAL PRIMARY KEY,
    barangay TEXT NOT NULL,
    project_id INTEGER NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Feedback (
    id SERIAL PRIMARY KEY,
    barangay TEXT NOT NULL,
    name TEXT DEFAULT 'Anonymous',
    message TEXT NOT NULL,
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    project_id INTEGER NULL
);

CREATE TABLE IF NOT EXISTS PendingAccounts (
    Name TEXT NOT NULL,
    Password TEXT NOT NULL,
    Barangay TEXT NOT NULL,
    Photo TEXT
);

CREATE TABLE IF NOT EXISTS ProjectComments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name TEXT DEFAULT 'Anonymous',
    message TEXT NOT NULL,
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ProjectRatings (
    project_id INTEGER PRIMARY KEY,
    barangay TEXT NOT NULL,
    average_rating REAL DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    rating_1_count INTEGER DEFAULT 0,
    rating_2_count INTEGER DEFAULT 0,
    rating_3_count INTEGER DEFAULT 0,
    rating_4_count INTEGER DEFAULT 0,
    rating_5_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ArchivedCouncilors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    barangay TEXT NOT NULL,
    privilege TEXT,
    cleared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Verified (
    Name TEXT NOT NULL,
    Barangay TEXT NOT NULL
);

-- ==================== INSERT DATA ====================

INSERT INTO "Budget" ("barangay","total_budget","updated_at") VALUES 
('Lahug',3957265.0,'2026-05-08 06:01:53'),
('Pajac',500000.0,'2026-05-08 08:34:46');

INSERT INTO "CommitteeBudget" ("barangay","committee_name","allocated_amount") VALUES 
('Lahug','Health',360000.0),
('Lahug','Education',320000.0),
('Lahug','Environment',290000.0),
('Lahug','Economic Empowerment',150000.0),
('Lahug','Social Inclusion and Equity',85000.0),
('Lahug','Peace Building and Security',310000.01),
('Lahug','Active Citizenship',510000.0),
('Lahug','Governance',370000.0),
('Lahug','Global Mobility',20000.0),
('Lahug','Agriculture',125000.0),
('Lahug','SK Honoraria',989280.0),
('Lahug','MOOE',282146.0),
('Lahug','Capital Outlay',145000.0),
('Pajac','Health',300000.0),
('Pajac','Sports',200000.0);

INSERT INTO "CommitteeMembers" ("id","committee_name","barangay","councilor_name","joined_at") VALUES 
(1,'Health','Lahug','Diane Louise Torres','2026-05-07 11:23:17'),
(7,'Education','Lahug','Jasmine Pearl Ong','2026-05-08 05:05:39'),
(8,'Environment','Lahug','Carlos Mendoza Reyes','2026-05-08 05:06:18'),
(9,'Economic Empowerment','Lahug','Francesca Isabelle Go','2026-05-08 05:07:05'),
(10,'Social Inclusion and Equity','Lahug','Gregorio San Jose Lopez','2026-05-08 05:07:52'),
(11,'Peace Building and Security','Lahug','Ismael Navarro Rivera','2026-05-08 05:08:30'),
(12,'Active Citizenship','Lahug','Hannah Beatrice Uy','2026-05-08 05:09:49'),
(13,'Governance','Lahug','Ana Marie Fernandez','2026-05-08 05:10:21'),
(14,'Global Mobility','Lahug','Juan Marie Pineda','2026-05-08 05:55:56'),
(15,'Agriculture','Lahug','Melody Dane Villaflor','2026-05-08 05:56:25'),
(16,'SK Honoraria','Lahug','Kievve Anthony Del Monte','2026-05-08 05:57:14'),
(17,'MOOE','Lahug','Celso Zane Gabutan','2026-05-08 05:57:46'),
(18,'Capital Outlay','Lahug','Emmanuel Cruz Villanueva','2026-05-08 05:59:19'),
(19,'Health','Lahug','Gregorio San Jose Lopez','2026-05-08 06:39:11'),
(20,'Health','Pajac','Felicity Grace Alonto','2026-05-08 08:28:15'),
(21,'Health','Pajac','Henrick James Dimagiba','2026-05-08 08:31:57'),
(22,'Sports','Pajac','Eduardo Manahan Flores','2026-05-08 08:33:48');

INSERT INTO "Committees" ("name","barangay","head_name") VALUES 
('Health','Lahug','Diane Louise Torres'),
('Education','Lahug','Jasmine Pearl Ong'),
('Environment','Lahug','Carlos Mendoza Reyes'),
('Economic Empowerment','Lahug','Francesca Isabelle Go'),
('Social Inclusion and Equity','Lahug','Gregorio San Jose Lopez'),
('Peace Building and Security','Lahug','Ismael Navarro Rivera'),
('Active Citizenship','Lahug','Hannah Beatrice Uy'),
('Governance','Lahug','Ana Marie Fernandez'),
('Global Mobility','Lahug','Juan Marie Pineda'),
('Agriculture','Lahug','Melody Dane Villaflor'),
('SK Honoraria','Lahug','Kievve Anthony Del Monte'),
('MOOE','Lahug','Celso Zane Gabutan'),
('Capital Outlay','Lahug','Emmanuel Cruz Villanueva'),
('Health','Pajac','Felicity Grace Alonto'),
('Sports','Pajac','Eduardo Manahan Flores');

INSERT INTO "Councilors" ("Name","Password","Barangay","approved","privilege") VALUES 
('Maximus Limpag','$2a$10$UesBfMTwbo5i8a2.MBqG3.bImPg/sGjsr.QEaqn20ZQ47nlWcx2lO','Pajac',1,'CHAIRMAN'),
('Ana Marie Fernandez','$2a$10$L46z84dqF.ydduVoGcE23.cYHCMjIdZNTE3uLfBIEFr7zcx5BXT4e','Lahug',1,'CHAIRMAN'),
('Carlos Mendoza Reyes','$2a$10$Kz8UtRQP.zWZqfq4dNExsOPPgt6ywBtD.Ax3lqs8OwKAUTWYZfdDG','Lahug',1,''),
('Diane Louise Torres','$2a$10$DlmjDQHZh0wivElOhwIItOZ9v1L3gEM38EOi1QjUj984FY9amM86W','Lahug',1,''),
('Emmanuel Cruz Villanueva','$2a$10$qZnrgkWTQbs6YVa210E6Lu9WWu8CdCVi0KYvifvLl9qULDZNH57xu','Lahug',1,'TREASURER'),
('Francesca Isabelle Go','$2a$10$640CP1JPTeDPpJk9ZWInnOze1y/AXPVhVr0VNbzdZIO6xCubxm3Zq','Lahug',1,''),
('Gregorio San Jose Lopez','$2a$10$EVVoJcDLEHC287bs6G1tiu48YQewrS8zdlWpohhUpV0nMMZUGjLJW','Lahug',1,''),
('Hannah Beatrice Uy','$2a$10$O03IEOb9RCToQbRiE97wIeY44swg79FaWlWE7X1Nmcdu.SpVIcazK','Lahug',1,''),
('Ismael Navarro Rivera','$2a$10$SFQy8CSJm4GNGCPCSxJocuyiPXAKTeoHgMqA2R8m/EHN1Ynqw9KG2','Lahug',1,''),
('Jasmine Pearl Ong','$2a$10$ANdRAB1M3hVHYDH0JJ0jOOV2elcKYtvvBmJ8CPxrSFT3Ucf/xwvZK','Lahug',1,''),
('Bernadette Claire Ramos','$2a$10$l2gg6sJe.OlkmsGeBuiBz.LqXj.QZXgqRFr29wlEAiLME1Co6WAKy','Pajac',1,'TREASURER'),
('Christian Paul Mercado','$2a$10$7xh7qSxl08pqpWWKZZZgCe.B5nxqrNGM3PQ9LUN/E8VFSvv01MZLC','Pajac',1,''),
('Danielle Kate Santiago','$2a$10$Pjjvu7AfIhNj9HDX9PqqGOZDlAjbyuOBF8YxtFyf/w//aayrJb0zy','Pajac',1,''),
('Eduardo Manahan Flores','$2a$10$WibIlxPH7Swhysqm0cgh0.pOBDVV8n4D2p1s45ml26H0Kwyuc.B/q','Pajac',1,''),
('Felicity Grace Alonto','$2a$10$i.fwnSRs9uxq4YrJexeQH.51na6reTIfc8INV3ieyneitfRwfp2Vi','Pajac',1,''),
('Henrick James Dimagiba','$2a$10$8OLTvZWu/tqSfd.z82A4deq0KmcpPhBA9S02x3iMcaV8F.TyHiEB.','Pajac',1,''),
('Isabella Marie Cebu','$2a$10$RFJYV/2kn0d.uHZOGP3qSutcbDoqV11crZnYzzxaihclsMxQ0KWny','Pajac',1,''),
('Jonathan Rey Bacolod','$2a$10$xezgMsjheJ5ebA9ZPgcy1O6vYb3skC26sdSiko5m4MaFg3VNX2g6a','Pajac',1,''),
('Patricia Louise Davao','$2a$10$t7tQ2mH3eCtUAc55hVGVEuH2j9VrwPVXK5LBouXS.TP0KPu5jvgKG','Pajac',1,''),
('Kenneth Lawrence Tan','$2a$10$.hdI0tdQCgpm.X4jJJZOveLitfZ3VRqlVpDP6OI7Rq5RAfqBnWmya','Lahug',1,''),
('Juan Marie Pineda','$2a$10$r9UglD9GBM8eZVcXZ3ebReFRufb6GcaabYJ0WhcCInePIr5R1ZleW','Lahug',1,NULL),
('Melody Dane Villaflor','$2a$10$yjQuEH.VFgHt.ujdBj9qh.oSwuJz9FeYZBfAUdYhgLPsqjx67xr9O','Lahug',1,NULL),
('Kievve Anthony Del Monte','$2a$10$zgh4MMbuLQRprXQIlHWfMuJIautRSwV/XFlzCnb0veh62w3oumGwK','Lahug',1,NULL),
('Celso Zane Gabutan','$2a$10$w3FgzHZTpOHogO2o1AY5.O7YmbWQH5X57tZsucwnQk4.KyH0Q2aFK','Lahug',1,NULL);

INSERT INTO "Developer" ("id","Name","Password","approved","privilege") VALUES 
(1,'Max Lennon Limpag','maxlennon123',1,'ADMIN'),
(2,'Selena Malig','selena123',1,'ADMIN');

INSERT INTO "Feedback" ("id","barangay","name","message","rating","created_at","project_id") VALUES 
(1,'Lahug','Juan Dela Cruz','Great project! This will really help our community.',5,'2026-05-08 05:18:56',8),
(2,'Lahug','Anonymous','Good.',5,'2026-05-08 07:44:03',14),
(3,'Lahug','Anonymous','Adequate',0,'2026-05-08 07:55:39',14),
(4,'Lahug','Anonymous','Good',5,'2026-05-08 08:19:46',14),
(5,'Lahug','Bad','No free',1,'2026-05-08 08:22:21',14),
(6,'Pajac','Anonymous','Nice',5,'2026-05-08 08:44:40',18),
(7,'Lahug','Max Lennon Limpag','Good but a bit slow',4,'2026-05-08 08:55:29',11),
(8,'Lahug','Anonymous','#BringHimHome',2,'2026-05-08 08:55:45',11);

INSERT INTO "PendingAccounts" ("Name","Password","Barangay","Photo") VALUES 
('Jaden Zion Rosales','$2a$10$LH2WP2bABQd6nn2pJL7uWed35dlIMD8cIeS16fnBJmWolNKFsvaXW','Lahug','1778219706336_Screenshot 2026-03-21 013028.png');

INSERT INTO "ProjectRatings" ("project_id","barangay","average_rating","total_ratings","rating_1_count","rating_2_count","rating_3_count","rating_4_count","rating_5_count","updated_at") VALUES 
(11,'Lahug',3.0,2,0,1,0,1,0,'2026-05-08 08:55:45'),
(14,'Lahug',3.66666666666667,3,1,0,0,0,2,'2026-05-08 08:22:22'),
(18,'Pajac',5.0,1,0,0,0,0,1,'2026-05-08 08:44:40');

INSERT INTO "Projects" ("id","project_name","purpose","committee_name","barangay","councilor_name","total_cost","status","created_at","rejection_reason","approved_by","approved_at") VALUES 
(11,'Free anti-rabies vaccination','Distribute anti-rabies vaccinations in sitios with a higher than average case of rabies.','Health','Lahug','Diane Louise Torres',10000.0,'APPROVED','2026-05-08 06:40:35',NULL,'Ana Marie Fernandez','2026-05-08 07:13:21'),
(14,'Free dental checkup','Free dental checkup in the Lahug public school','Health','Lahug','Diane Louise Torres',30000.0,'APPROVED','2026-05-08 07:10:05',NULL,'Ana Marie Fernandez','2026-05-08 07:13:19'),
(15,'Free M94 mask distribution','Free mask distribution in lower income neighborhoods to combat the dangers of the haze.','Health','Lahug','Diane Louise Torres',20000.0,'APPROVED','2026-05-08 07:10:44',NULL,'Ana Marie Fernandez','2026-05-08 07:13:18'),
(16,'Health Fair','An event held in the public schools and surrounding neighborhoods to encourage the consumption of healthy food.','Health','Lahug','Diane Louise Torres',30000.0,'APPROVED','2026-05-08 07:11:50',NULL,'Ana Marie Fernandez','2026-05-08 07:13:16'),
(17,'Court Renovation','Court','Sports','Pajac','Eduardo Manahan Flores',75000.0,'REJECTED','2026-05-08 08:37:48','Fix grammar.','Maximus Limpag','2026-05-08 08:45:36'),
(18,'Tournament','Test','Sports','Pajac','Eduardo Manahan Flores',50000.0,'APPROVED','2026-05-08 08:40:04',NULL,'Maximus Limpag','2026-05-08 08:43:24'),
(19,'Test','Test','Sports','Pajac','Eduardo Manahan Flores',85000.0,'PENDING','2026-05-08 08:47:37',NULL,NULL,NULL);

CREATE INDEX idx_feedback_project_id ON Feedback(project_id);