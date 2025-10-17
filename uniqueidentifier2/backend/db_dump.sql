PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE runs (
            run_id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            file_a TEXT,
            file_b TEXT,
            num_columns INTEGER,
            file_a_rows INTEGER,
            file_b_rows INTEGER,
            status TEXT DEFAULT 'pending',
            current_stage TEXT DEFAULT 'initializing',
            progress_percent INTEGER DEFAULT 0,
            started_at TEXT,
            completed_at TEXT,
            error_message TEXT,
            working_directory TEXT,
            environment TEXT DEFAULT 'default'
        );
INSERT INTO runs VALUES(1,'2025-10-15 15:32:48','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-15 15:32:48','2025-10-15 15:32:49',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(2,'2025-10-15 20:42:12','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-15 20:42:12','2025-10-15 20:42:13',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(3,'2025-10-15 20:48:22','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-15 20:48:22','2025-10-15 20:48:22',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(4,'2025-10-15 21:06:55','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-15 21:06:55','2025-10-15 21:06:55',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(5,'2025-10-15 21:09:45','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-15 21:09:45','2025-10-15 21:09:46',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(6,'2025-10-15 21:11:54','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-15 21:11:54','2025-10-15 21:11:54',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(7,'2025-10-15 21:21:51','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-15 21:21:51','2025-10-15 21:21:51',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(8,'2025-10-15 22:04:07','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-15 22:04:07','2025-10-15 22:04:07',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(9,'2025-10-16 15:24:52','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-16 15:24:52','2025-10-16 15:24:52',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(10,'2025-10-16 17:45:54','sample_file_a.csv','sample_file_b.csv',2,NULL,NULL,'error','failed',0,'2025-10-16 17:45:54',NULL,'Job failed to start - please retry (fixed after backend update)','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(11,'2025-10-16 17:54:54','sample_file_a.csv','sample_file_b.csv',2,NULL,NULL,'error','failed',0,'2025-10-16 17:54:54',NULL,'Job failed to start - please retry (fixed after backend update)','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(12,'2025-10-16 18:03:36','sample_file_a.csv','sample_file_b.csv',2,NULL,NULL,'error','failed',0,'2025-10-16 18:03:36',NULL,'Job failed to start - please retry','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(13,'2025-10-16 18:10:17','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-16 18:10:17','2025-10-16 18:10:18',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(14,'2025-10-16 18:38:26','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-16 18:38:26','2025-10-16 18:38:27',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(15,'2025-10-16 18:38:50','sample_file_a.csv','sample_file_b.csv',2,NULL,NULL,'error','failed',10,'2025-10-16 18:38:50',NULL,NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(16,'2025-10-16 18:44:05','sample_file_a.csv','sample_file_b.csv',2,10,12,'completed','completed',100,'2025-10-16 18:44:05','2025-10-16 18:44:06',NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(17,'2025-10-17 10:55:09','sample_file_a.csv','sample_file_b.csv',2,NULL,NULL,'error','storing_results',85,'2025-10-17 10:55:09',NULL,'local variable ''df_a'' referenced before assignment','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(18,'2025-10-17 10:55:44','sample_file_a.csv','sample_file_b.csv',2,NULL,NULL,'error','storing_results',85,'2025-10-17 10:55:44',NULL,'local variable ''df_a'' referenced before assignment','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
INSERT INTO runs VALUES(19,'2025-10-17 10:58:48','sample_file_a.csv','sample_file_b.csv',2,NULL,NULL,'running','validating_data',30,'2025-10-17 10:58:48',NULL,NULL,'/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/','default');
CREATE TABLE job_stages (
            stage_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            stage_name TEXT,
            stage_order INTEGER,
            status TEXT DEFAULT 'pending',
            started_at TEXT,
            completed_at TEXT,
            details TEXT,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
INSERT INTO job_stages VALUES(1,1,'reading_files',1,'completed',NULL,'2025-10-15 15:32:48','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(2,1,'data_quality_check',2,'completed','2025-10-15 15:32:48','2025-10-15 15:32:48','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(3,1,'validating_data',3,'completed','2025-10-15 15:32:48','2025-10-15 15:32:48','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(4,1,'analyzing_file_a',4,'completed','2025-10-15 15:32:48','2025-10-15 15:32:48','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(5,1,'analyzing_file_b',5,'completed','2025-10-15 15:32:49','2025-10-15 15:32:49','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(6,1,'storing_results',6,'completed','2025-10-15 15:32:49','2025-10-15 15:32:49','Saved 2 results');
INSERT INTO job_stages VALUES(7,1,'generating_comparison_cache',7,'completed','2025-10-15 15:32:49','2025-10-15 15:32:49','Generated 1 comparison caches');
INSERT INTO job_stages VALUES(8,1,'generating_full_comparisons',8,'completed','2025-10-15 15:32:49','2025-10-15 15:32:49','Generated 2 full comparison exports (includes file-file)');
INSERT INTO job_stages VALUES(9,2,'reading_files',1,'completed','2025-10-15 20:42:12','2025-10-15 20:42:12','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(10,2,'data_quality_check',2,'completed','2025-10-15 20:42:12','2025-10-15 20:42:12','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(11,2,'validating_data',3,'completed','2025-10-15 20:42:12','2025-10-15 20:42:12','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(12,2,'analyzing_file_a',4,'completed','2025-10-15 20:42:12','2025-10-15 20:42:12','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(13,2,'analyzing_file_b',5,'completed','2025-10-15 20:42:12','2025-10-15 20:42:12','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(14,2,'storing_results',6,'completed','2025-10-15 20:42:12','2025-10-15 20:42:12','Saved 2 results');
INSERT INTO job_stages VALUES(15,2,'generating_comparison_cache',7,'completed','2025-10-15 20:42:12','2025-10-15 20:42:13','Generated 1 comparison caches');
INSERT INTO job_stages VALUES(16,2,'generating_comparisons',8,'completed','2025-10-15 20:42:13','2025-10-15 20:42:13','Generated file A-B comparison');
INSERT INTO job_stages VALUES(17,3,'reading_files',1,'completed','2025-10-15 20:48:22','2025-10-15 20:48:22','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(18,3,'data_quality_check',2,'completed','2025-10-15 20:48:22','2025-10-15 20:48:22','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(19,3,'validating_data',3,'completed','2025-10-15 20:48:22','2025-10-15 20:48:22','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(20,3,'analyzing_file_a',4,'completed','2025-10-15 20:48:22','2025-10-15 20:48:22','Analyzed 2 combinations');
INSERT INTO job_stages VALUES(21,3,'analyzing_file_b',5,'completed','2025-10-15 20:48:22','2025-10-15 20:48:22','Analyzed 2 combinations');
INSERT INTO job_stages VALUES(22,3,'storing_results',6,'completed','2025-10-15 20:48:22','2025-10-15 20:48:22','Saved 4 results');
INSERT INTO job_stages VALUES(23,3,'generating_comparison_cache',7,'completed','2025-10-15 20:48:22','2025-10-15 20:48:22','Generated 2 comparison caches');
INSERT INTO job_stages VALUES(24,3,'generating_comparisons',8,'completed','2025-10-15 20:48:22','2025-10-15 20:48:22','Generated file A-B comparison');
INSERT INTO job_stages VALUES(25,4,'reading_files',1,'completed','2025-10-15 21:06:55','2025-10-15 21:06:55','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(26,4,'validating_data',2,'completed','2025-10-15 21:06:55','2025-10-15 21:06:55','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(27,4,'analyzing_file_a',3,'completed','2025-10-15 21:06:55','2025-10-15 21:06:55','Analyzed 2 combinations');
INSERT INTO job_stages VALUES(28,4,'analyzing_file_b',4,'completed','2025-10-15 21:06:55','2025-10-15 21:06:55','Analyzed 2 combinations');
INSERT INTO job_stages VALUES(29,4,'storing_results',5,'completed','2025-10-15 21:06:55','2025-10-15 21:06:55','Saved 4 results');
INSERT INTO job_stages VALUES(30,4,'generating_comparisons',6,'error','2025-10-15 21:06:55',NULL,'Export generation failed: name ''analyzed_combinations'' is not defined');
INSERT INTO job_stages VALUES(31,5,'reading_files',1,'completed','2025-10-15 21:09:45','2025-10-15 21:09:46','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(32,5,'validating_data',2,'completed','2025-10-15 21:09:46','2025-10-15 21:09:46','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(33,5,'analyzing_file_a',3,'completed','2025-10-15 21:09:46','2025-10-15 21:09:46','Analyzed 2 combinations');
INSERT INTO job_stages VALUES(34,5,'analyzing_file_b',4,'completed','2025-10-15 21:09:46','2025-10-15 21:09:46','Analyzed 2 combinations');
INSERT INTO job_stages VALUES(35,5,'storing_results',5,'completed','2025-10-15 21:09:46','2025-10-15 21:09:46','Saved 4 results');
INSERT INTO job_stages VALUES(36,5,'generating_comparisons',6,'completed','2025-10-15 21:09:46','2025-10-15 21:09:46','Generated 1 column combinations + file A-B comparison');
INSERT INTO job_stages VALUES(37,6,'reading_files',1,'completed','2025-10-15 21:11:54','2025-10-15 21:11:54','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(38,6,'data_quality_check',2,'completed','2025-10-15 21:11:54','2025-10-15 21:11:54','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(39,6,'validating_data',3,'completed','2025-10-15 21:11:54','2025-10-15 21:11:54','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(40,6,'analyzing_file_a',4,'completed','2025-10-15 21:11:54','2025-10-15 21:11:54','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(41,6,'analyzing_file_b',5,'completed','2025-10-15 21:11:54','2025-10-15 21:11:54','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(42,6,'storing_results',6,'completed','2025-10-15 21:11:54','2025-10-15 21:11:54','Saved 2 results');
INSERT INTO job_stages VALUES(43,7,'reading_files',1,'completed','2025-10-15 21:21:51','2025-10-15 21:21:51','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(44,7,'data_quality_check',2,'completed','2025-10-15 21:21:51','2025-10-15 21:21:51','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(45,7,'validating_data',3,'completed','2025-10-15 21:21:51','2025-10-15 21:21:51','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(46,7,'analyzing_file_a',4,'completed','2025-10-15 21:21:51','2025-10-15 21:21:51','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(47,7,'analyzing_file_b',5,'completed','2025-10-15 21:21:51','2025-10-15 21:21:51','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(48,7,'storing_results',6,'completed','2025-10-15 21:21:51','2025-10-15 21:21:51','Saved 2 results');
INSERT INTO job_stages VALUES(49,8,'reading_files',1,'completed','2025-10-15 22:04:07','2025-10-15 22:04:07','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(50,8,'data_quality_check',2,'completed','2025-10-15 22:04:07','2025-10-15 22:04:07','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(51,8,'validating_data',3,'completed','2025-10-15 22:04:07','2025-10-15 22:04:07','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(52,8,'analyzing_file_a',4,'completed','2025-10-15 22:04:07','2025-10-15 22:04:07','Analyzed 2 combinations');
INSERT INTO job_stages VALUES(53,8,'analyzing_file_b',5,'completed','2025-10-15 22:04:07','2025-10-15 22:04:07','Analyzed 2 combinations');
INSERT INTO job_stages VALUES(54,8,'storing_results',6,'completed','2025-10-15 22:04:07','2025-10-15 22:04:07','Saved 4 results');
INSERT INTO job_stages VALUES(55,8,'generating_comparisons',7,'completed','2025-10-15 22:04:07','2025-10-15 22:04:07','Generated 1 column combinations + file A-B comparison');
INSERT INTO job_stages VALUES(56,9,'reading_files',1,'completed','2025-10-16 15:24:52','2025-10-16 15:24:52','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(57,9,'data_quality_check',2,'completed','2025-10-16 15:24:52','2025-10-16 15:24:52','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(58,9,'validating_data',3,'completed','2025-10-16 15:24:52','2025-10-16 15:24:52','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(59,9,'analyzing_file_a',4,'completed','2025-10-16 15:24:52','2025-10-16 15:24:52','Analyzed 4 combinations');
INSERT INTO job_stages VALUES(60,9,'analyzing_file_b',5,'completed','2025-10-16 15:24:52','2025-10-16 15:24:52','Analyzed 4 combinations');
INSERT INTO job_stages VALUES(61,9,'storing_results',6,'completed','2025-10-16 15:24:52','2025-10-16 15:24:52','Saved 8 results');
INSERT INTO job_stages VALUES(62,9,'generating_comparisons',7,'completed','2025-10-16 15:24:52','2025-10-16 15:24:52','Generated 3 column combinations + file A-B comparison');
INSERT INTO job_stages VALUES(63,10,'reading_files',1,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(64,10,'validating_data',2,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(65,10,'analyzing_file_a',3,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(66,10,'analyzing_file_b',4,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(67,10,'storing_results',5,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(68,11,'reading_files',1,'in_progress','2025-10-16 17:54:54',NULL,'Loading data files (full)');
INSERT INTO job_stages VALUES(69,11,'validating_data',2,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(70,11,'analyzing_file_a',3,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(71,11,'analyzing_file_b',4,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(72,11,'storing_results',5,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(73,12,'reading_files',1,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(74,12,'data_quality_check',2,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(75,12,'validating_data',3,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(76,12,'analyzing_file_a',4,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(77,12,'analyzing_file_b',5,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(78,12,'storing_results',6,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(79,13,'reading_files',1,'completed','2025-10-16 18:10:17','2025-10-16 18:10:17','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(80,13,'data_quality_check',2,'completed','2025-10-16 18:10:17','2025-10-16 18:10:17','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(81,13,'validating_data',3,'completed','2025-10-16 18:10:17','2025-10-16 18:10:17','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(82,13,'analyzing_file_a',4,'completed','2025-10-16 18:10:17','2025-10-16 18:10:18','Analyzed 17 combinations');
INSERT INTO job_stages VALUES(83,13,'analyzing_file_b',5,'completed','2025-10-16 18:10:18','2025-10-16 18:10:18','Analyzed 17 combinations');
INSERT INTO job_stages VALUES(84,13,'storing_results',6,'completed','2025-10-16 18:10:18','2025-10-16 18:10:18','Saved 34 results');
INSERT INTO job_stages VALUES(85,14,'reading_files',1,'completed','2025-10-16 18:38:26','2025-10-16 18:38:27','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(86,14,'data_quality_check',2,'completed','2025-10-16 18:38:27','2025-10-16 18:38:27','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(87,14,'validating_data',3,'completed','2025-10-16 18:38:27','2025-10-16 18:38:27','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(88,14,'analyzing_file_a',4,'completed','2025-10-16 18:38:27','2025-10-16 18:38:27','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(89,14,'analyzing_file_b',5,'completed','2025-10-16 18:38:27','2025-10-16 18:38:27','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(90,14,'storing_results',6,'completed','2025-10-16 18:38:27','2025-10-16 18:38:27','Saved 2 results');
INSERT INTO job_stages VALUES(91,15,'reading_files',1,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(92,15,'data_quality_check',2,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(93,15,'validating_data',3,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(94,15,'analyzing_file_a',4,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(95,15,'analyzing_file_b',5,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(96,15,'storing_results',6,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(97,16,'reading_files',1,'completed','2025-10-16 18:44:05','2025-10-16 18:44:05','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(98,16,'data_quality_check',2,'completed','2025-10-16 18:44:05','2025-10-16 18:44:05','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(99,16,'validating_data',3,'completed','2025-10-16 18:44:05','2025-10-16 18:44:05','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(100,16,'analyzing_file_a',4,'completed','2025-10-16 18:44:05','2025-10-16 18:44:05','Analyzed 17 combinations');
INSERT INTO job_stages VALUES(101,16,'analyzing_file_b',5,'completed','2025-10-16 18:44:05','2025-10-16 18:44:06','Analyzed 17 combinations');
INSERT INTO job_stages VALUES(102,16,'storing_results',6,'completed','2025-10-16 18:44:06','2025-10-16 18:44:06','Saved 34 results');
INSERT INTO job_stages VALUES(103,17,'reading_files',1,'completed','2025-10-17 10:55:09','2025-10-17 10:55:09','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(104,17,'data_quality_check',2,'completed','2025-10-17 10:55:09','2025-10-17 10:55:09','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(105,17,'validating_data',3,'completed','2025-10-17 10:55:09','2025-10-17 10:55:10','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(106,17,'analyzing_file_a',4,'completed','2025-10-17 10:55:10','2025-10-17 10:55:16','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(107,17,'analyzing_file_b',5,'completed','2025-10-17 10:55:16','2025-10-17 10:55:16','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(108,17,'storing_results',6,'error','2025-10-17 10:55:16','2025-10-17 10:55:16','Job failed');
INSERT INTO job_stages VALUES(109,17,'generating_comparisons',7,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(110,18,'reading_files',1,'completed','2025-10-17 10:55:44','2025-10-17 10:55:44','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(111,18,'data_quality_check',2,'completed','2025-10-17 10:55:44','2025-10-17 10:55:44','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(112,18,'validating_data',3,'completed','2025-10-17 10:55:44','2025-10-17 10:55:44','✅ Validated 5 matching columns');
INSERT INTO job_stages VALUES(113,18,'analyzing_file_a',4,'completed','2025-10-17 10:55:44','2025-10-17 10:55:45','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(114,18,'analyzing_file_b',5,'completed','2025-10-17 10:55:45','2025-10-17 10:55:45','Analyzed 1 combinations');
INSERT INTO job_stages VALUES(115,18,'storing_results',6,'error','2025-10-17 10:55:45','2025-10-17 10:55:45','Job failed');
INSERT INTO job_stages VALUES(116,18,'generating_comparisons',7,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(117,19,'reading_files',1,'completed','2025-10-17 10:58:48','2025-10-17 10:58:48','Loaded 10 and 12 rows');
INSERT INTO job_stages VALUES(118,19,'data_quality_check',2,'completed','2025-10-17 10:58:48','2025-10-17 10:58:48','⚠️ ⚠️ Critical issues found: 2 high severity, 0 medium severity');
INSERT INTO job_stages VALUES(119,19,'validating_data',3,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(120,19,'analyzing_file_a',4,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(121,19,'analyzing_file_b',5,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(122,19,'storing_results',6,'pending',NULL,NULL,NULL);
INSERT INTO job_stages VALUES(123,19,'generating_comparisons',7,'pending',NULL,NULL,NULL);
CREATE TABLE analysis_results (
            run_id INTEGER,
            side TEXT,
            columns TEXT,
            total_rows INTEGER,
            unique_rows INTEGER,
            duplicate_rows INTEGER,
            duplicate_count INTEGER,
            uniqueness_score REAL,
            is_unique_key INTEGER,
            UNIQUE(run_id, side, columns),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
INSERT INTO analysis_results VALUES(1,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(1,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(2,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(2,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(3,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(3,'A','id,name,email,department,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(3,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(3,'B','id,name,email,department,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(4,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(4,'A','id,name,email,department,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(4,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(4,'B','id,name,email,department,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(5,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(5,'A','id,name,email,department,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(5,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(5,'B','id,name,email,department,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(6,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(6,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(7,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(7,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(8,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(8,'A','id,name,email,department,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(8,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(8,'B','id,name,email,department,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(9,'A','department,email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(9,'A','id,name,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(9,'A','department,name,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(9,'A','id,name,email,department,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(9,'B','department,email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(9,'B','id,name,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(9,'B','department,name,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(9,'B','id,name,email,department,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','id',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','email',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','id,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','email,id',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','department,id',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','id,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','name,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','email,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','id,email',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','id,department',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','name,email',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','name,department',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','email,department',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'A','department,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','id',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','email',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','id,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','email,id',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','department,id',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','id,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','name,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','email,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','id,email',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','id,department',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','name,email',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','name,department',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','email,department',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(13,'B','department,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(14,'A','department,email,id,name,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(14,'B','department,email,id,name,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','id',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','email',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','id,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','email,id',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','department,id',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','id,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','email,name',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','name,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','email,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','id,email',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','id,department',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','name,email',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','name,department',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','email,department',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'A','department,salary',10,10,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','id',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','email',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','id,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','email,id',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','department,id',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','id,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','email,name',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','name,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','email,salary',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','id,email',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','id,department',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','name,email',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','name,department',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','email,department',12,12,0,0,100.0,1);
INSERT INTO analysis_results VALUES(16,'B','department,salary',12,12,0,0,100.0,1);
CREATE TABLE duplicate_samples (
            run_id INTEGER,
            side TEXT,
            columns TEXT,
            duplicate_value TEXT,
            occurrence_count INTEGER,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
CREATE TABLE run_parameters (
            run_id INTEGER PRIMARY KEY,
            max_rows INTEGER,
            expected_combinations TEXT,
            excluded_combinations TEXT,
            working_directory TEXT,
            data_quality_check INTEGER DEFAULT 0,
            environment TEXT DEFAULT 'default',
            validated_columns TEXT,
            file_a_delimiter TEXT,
            file_b_delimiter TEXT,
            generate_comparisons INTEGER DEFAULT 1,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
INSERT INTO run_parameters VALUES(1,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(2,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(3,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(4,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',0,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(5,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',0,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(6,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',0);
INSERT INTO run_parameters VALUES(7,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',0);
INSERT INTO run_parameters VALUES(8,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(9,0,replace(replace('department,email,name\r\nid,name,salary\r\ndepartment,name,salary','\r',char(13)),'\n',char(10)),'','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(10,0,'','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',0,'default',NULL,NULL,NULL,0);
INSERT INTO run_parameters VALUES(11,0,'','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',0,'default',NULL,NULL,NULL,0);
INSERT INTO run_parameters VALUES(12,0,'','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default',NULL,NULL,NULL,0);
INSERT INTO run_parameters VALUES(13,0,'','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',0);
INSERT INTO run_parameters VALUES(14,0,'department,email,id,name,salary','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',0);
INSERT INTO run_parameters VALUES(15,0,'','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default',NULL,NULL,NULL,0);
INSERT INTO run_parameters VALUES(16,0,'','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',0);
INSERT INTO run_parameters VALUES(17,0,'','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(18,0,'','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default','["id", "name", "email", "department", "salary"]',',',',',1);
INSERT INTO run_parameters VALUES(19,0,'department,email,name','','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/sample_data/',1,'default',NULL,NULL,NULL,1);
CREATE TABLE result_files (
            file_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            file_type TEXT,
            side TEXT,
            columns TEXT,
            file_path TEXT,
            file_size INTEGER,
            created_at TEXT,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
CREATE TABLE data_quality_results (
            run_id INTEGER PRIMARY KEY,
            quality_summary TEXT,
            quality_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
INSERT INTO data_quality_results VALUES(1,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-15 19:32:48');
INSERT INTO data_quality_results VALUES(2,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 00:42:12');
INSERT INTO data_quality_results VALUES(3,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 00:48:22');
INSERT INTO data_quality_results VALUES(6,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 01:11:54');
INSERT INTO data_quality_results VALUES(7,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 01:21:51');
INSERT INTO data_quality_results VALUES(8,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 02:04:07');
INSERT INTO data_quality_results VALUES(9,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 19:24:52');
INSERT INTO data_quality_results VALUES(13,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 22:10:17');
INSERT INTO data_quality_results VALUES(14,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 22:38:27');
INSERT INTO data_quality_results VALUES(16,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-16 22:44:05');
INSERT INTO data_quality_results VALUES(17,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-17 14:55:09');
INSERT INTO data_quality_results VALUES(18,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-17 14:55:44');
INSERT INTO data_quality_results VALUES(19,'⚠️ Critical issues found: 2 high severity, 0 medium severity','{"summary": {"status": "critical", "status_message": "\u26a0\ufe0f Critical issues found: 2 high severity, 0 medium severity", "total_issues": 2, "high_severity_count": 2, "medium_severity_count": 0, "file1_issues": 1, "file2_issues": 1, "cross_file_issues": 0}, "file1_report": {"file_name": "sample_file_a.csv", "total_rows": 10, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 90.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 9, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 9, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 10}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 10}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 10}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 10, "non_null_values": 10, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 10}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 9, boolean: 1 values", "severity": "high"}]}, "file2_report": {"file_name": "sample_file_b.csv", "total_rows": 12, "total_columns": 5, "columns": {"id": {"pattern_type": "integer", "consistency": 91.67, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 11, "boolean": 1}, "sample_values": [1, 2, 3, 4, 5], "pattern_examples": {"boolean": ["1"], "integer": ["2", "3", "4"]}, "issues": ["Mixed data types detected - integer: 11, boolean: 1 values"]}, "name": {"pattern_type": "string", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"string": 12}, "sample_values": ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"], "pattern_examples": {"string": ["John Doe", "Jane Smith", "Bob Johnson"]}, "issues": []}, "email": {"pattern_type": "email", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"email": 12}, "sample_values": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com", "alice.brown@email.com", "charlie.wilson@email.com"], "pattern_examples": {"email": ["john.doe@email.com", "jane.smith@email.com", "bob.johnson@email.com"]}, "issues": []}, "department": {"pattern_type": "alphanumeric", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"alphanumeric": 12}, "sample_values": ["Engineering", "Marketing", "Engineering", "HR", "Sales"], "pattern_examples": {"alphanumeric": ["Engineering", "Marketing", "Engineering"]}, "issues": []}, "salary": {"pattern_type": "integer", "consistency": 100.0, "total_values": 12, "non_null_values": 12, "null_count": 0, "null_percentage": 0.0, "pattern_distribution": {"integer": 12}, "sample_values": [75000, 65000, 80000, 55000, 70000], "pattern_examples": {"integer": ["75000", "65000", "80000"]}, "issues": []}}, "overall_issues": [{"column": "id", "issue": "Mixed data types detected - integer: 11, boolean: 1 values", "severity": "high"}]}, "discrepancies": []}','2025-10-17 14:58:48');
CREATE TABLE environments (
            env_id INTEGER PRIMARY KEY AUTOINCREMENT,
            env_name TEXT UNIQUE,
            env_type TEXT,
            host TEXT,
            port INTEGER,
            base_path TEXT,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
CREATE TABLE comparison_summary (
            run_id INTEGER,
            column_combination TEXT,
            matched_count INTEGER DEFAULT 0,
            only_a_count INTEGER DEFAULT 0,
            only_b_count INTEGER DEFAULT 0,
            total_a INTEGER DEFAULT 0,
            total_b INTEGER DEFAULT 0,
            generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (run_id, column_combination),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
INSERT INTO comparison_summary VALUES(1,'department,email,name',10,0,2,10,12,'2025-10-15T15:32:49.185448');
INSERT INTO comparison_summary VALUES(1,'id,name,email,department,salary',10,0,2,10,12,'2025-10-15T15:32:49.254343');
INSERT INTO comparison_summary VALUES(2,'department,email,name',10,0,2,10,12,'2025-10-16 00:42:13');
INSERT INTO comparison_summary VALUES(2,'id,name,email,department,salary',10,0,2,10,12,'2025-10-15T20:42:13.114407');
INSERT INTO comparison_summary VALUES(3,'department,email,name',10,0,2,10,12,'2025-10-16 00:48:22');
INSERT INTO comparison_summary VALUES(3,'id,name,email,department,salary',10,0,2,10,12,'2025-10-15T20:48:22.883526');
INSERT INTO comparison_summary VALUES(5,'department,email,name',10,0,2,10,12,'2025-10-15T21:09:46.197932');
INSERT INTO comparison_summary VALUES(5,'id,name,email,department,salary',10,0,2,10,12,'2025-10-15T21:09:46.243277');
INSERT INTO comparison_summary VALUES(8,'department,email,name',10,0,2,10,12,'2025-10-15T22:04:07.510714');
INSERT INTO comparison_summary VALUES(8,'id,name,email,department,salary',10,0,2,10,12,'2025-10-15T22:04:07.564817');
INSERT INTO comparison_summary VALUES(9,'department,email,name',10,0,2,10,12,'2025-10-16T15:24:52.549392');
INSERT INTO comparison_summary VALUES(9,'id,name,salary',10,0,2,10,12,'2025-10-16T15:24:52.626475');
INSERT INTO comparison_summary VALUES(9,'department,name,salary',10,0,2,10,12,'2025-10-16T15:24:52.692448');
INSERT INTO comparison_summary VALUES(9,'id,name,email,department,salary',10,0,2,10,12,'2025-10-16T15:24:52.761174');
CREATE TABLE comparison_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            column_combination TEXT,
            category TEXT,
            key_value TEXT,
            position INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
CREATE TABLE comparison_export_files (
            file_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            column_combination TEXT,
            category TEXT,
            file_path TEXT,
            file_size INTEGER DEFAULT 0,
            row_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            chunk_index INTEGER DEFAULT 1, status TEXT DEFAULT 'completed',
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );
INSERT INTO comparison_export_files VALUES(1,1,'department,email,name','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_1/comparison_department_email_name_90e08df91f33/matched_chunk_0001.csv',535,10,'2025-10-15T15:32:49.186887',1,'completed');
INSERT INTO comparison_export_files VALUES(2,1,'department,email,name','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_1/comparison_department_email_name_90e08df91f33/only_b_chunk_0001.csv',152,2,'2025-10-15T15:32:49.186887',1,'completed');
INSERT INTO comparison_export_files VALUES(3,1,'id,name,email,department,salary','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_1/comparison_id_name_email_cce46c1fe7d2/matched_chunk_0001.csv',535,10,'2025-10-15T15:32:49.254812',1,'completed');
INSERT INTO comparison_export_files VALUES(4,1,'id,name,email,department,salary','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_1/comparison_id_name_email_cce46c1fe7d2/only_b_chunk_0001.csv',152,2,'2025-10-15T15:32:49.254812',1,'completed');
INSERT INTO comparison_export_files VALUES(5,2,'id,name,email,department,salary','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_2/comparison_id_name_email_cce46c1fe7d2/matched_chunk_0001.csv',535,10,'2025-10-15T20:42:13.115221',1,'completed');
INSERT INTO comparison_export_files VALUES(6,2,'id,name,email,department,salary','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_2/comparison_id_name_email_cce46c1fe7d2/only_b_chunk_0001.csv',152,2,'2025-10-15T20:42:13.115221',1,'completed');
INSERT INTO comparison_export_files VALUES(7,3,'id,name,email,department,salary','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_3/comparison_id_name_email_cce46c1fe7d2/matched_chunk_0001.csv',535,10,'2025-10-15T20:48:22.884091',1,'completed');
INSERT INTO comparison_export_files VALUES(8,3,'id,name,email,department,salary','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_3/comparison_id_name_email_cce46c1fe7d2/only_b_chunk_0001.csv',152,2,'2025-10-15T20:48:22.884091',1,'completed');
INSERT INTO comparison_export_files VALUES(9,5,'department,email,name','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_5/comparison_department_email_name_90e08df91f33/matched_chunk_0001.csv',535,10,'2025-10-15T21:09:46.198702',1,'completed');
INSERT INTO comparison_export_files VALUES(10,5,'department,email,name','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_5/comparison_department_email_name_90e08df91f33/only_b_chunk_0001.csv',152,2,'2025-10-15T21:09:46.198702',1,'completed');
INSERT INTO comparison_export_files VALUES(11,5,'id,name,email,department,salary','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_5/comparison_id_name_email_cce46c1fe7d2/matched_chunk_0001.csv',535,10,'2025-10-15T21:09:46.243863',1,'completed');
INSERT INTO comparison_export_files VALUES(12,5,'id,name,email,department,salary','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_5/comparison_id_name_email_cce46c1fe7d2/only_b_chunk_0001.csv',152,2,'2025-10-15T21:09:46.243863',1,'completed');
INSERT INTO comparison_export_files VALUES(13,8,'department,email,name','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_8/comparison_department_email_name_90e08df91f33/matched_chunk_0001.csv',535,10,'2025-10-15T22:04:07.511237',1,'completed');
INSERT INTO comparison_export_files VALUES(14,8,'department,email,name','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_8/comparison_department_email_name_90e08df91f33/only_b_chunk_0001.csv',152,2,'2025-10-15T22:04:07.511237',1,'completed');
INSERT INTO comparison_export_files VALUES(15,8,'id,name,email,department,salary','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_8/comparison_id_name_email_cce46c1fe7d2/matched_chunk_0001.csv',535,10,'2025-10-15T22:04:07.565287',1,'completed');
INSERT INTO comparison_export_files VALUES(16,8,'id,name,email,department,salary','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_8/comparison_id_name_email_cce46c1fe7d2/only_b_chunk_0001.csv',152,2,'2025-10-15T22:04:07.565287',1,'completed');
INSERT INTO comparison_export_files VALUES(19,9,'department,email,name','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_9/comparison_department_email_name_90e08df91f33/matched_chunk_0001.csv',535,10,'2025-10-16T15:24:52.554107',1,'completed');
INSERT INTO comparison_export_files VALUES(20,9,'department,email,name','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_9/comparison_department_email_name_90e08df91f33/only_b_chunk_0001.csv',152,2,'2025-10-16T15:24:52.554107',1,'completed');
INSERT INTO comparison_export_files VALUES(23,9,'id,name,salary','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_9/comparison_id_name_salary_9487492ca23a/matched_chunk_0001.csv',535,10,'2025-10-16T15:24:52.627012',1,'completed');
INSERT INTO comparison_export_files VALUES(24,9,'id,name,salary','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_9/comparison_id_name_salary_9487492ca23a/only_b_chunk_0001.csv',152,2,'2025-10-16T15:24:52.627012',1,'completed');
INSERT INTO comparison_export_files VALUES(27,9,'department,name,salary','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_9/comparison_department_name_salary_dbc4a60ec7eb/matched_chunk_0001.csv',535,10,'2025-10-16T15:24:52.693010',1,'completed');
INSERT INTO comparison_export_files VALUES(28,9,'department,name,salary','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_9/comparison_department_name_salary_dbc4a60ec7eb/only_b_chunk_0001.csv',152,2,'2025-10-16T15:24:52.693010',1,'completed');
INSERT INTO comparison_export_files VALUES(31,9,'id,name,email,department,salary','matched','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_9/comparison_id_name_email_cce46c1fe7d2/matched_chunk_0001.csv',535,10,'2025-10-16T15:24:52.761995',1,'completed');
INSERT INTO comparison_export_files VALUES(32,9,'id,name,email,department,salary','only_b','/Users/praveennandyala/uniquekeyidentifier/uniqueidentifier2/backend/comparison_exports/run_9/comparison_id_name_email_cce46c1fe7d2/only_b_chunk_0001.csv',152,2,'2025-10-16T15:24:52.761995',1,'completed');
CREATE TABLE audit_log (
                audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_category TEXT NOT NULL,
                user_id TEXT,
                run_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                status TEXT DEFAULT 'success',
                error_message TEXT,
                duration_ms INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
CREATE TABLE performance_metrics (
                metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                metric_unit TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES runs(run_id)
            );
CREATE TABLE user_activity (
                activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_id TEXT,
                activity_type TEXT NOT NULL,
                resource_accessed TEXT,
                timestamp TEXT NOT NULL,
                duration_seconds INTEGER,
                success INTEGER DEFAULT 1
            );
CREATE TABLE system_health (
                health_id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                cpu_percent REAL,
                memory_percent REAL,
                disk_usage_percent REAL,
                active_connections INTEGER,
                queue_size INTEGER,
                status TEXT DEFAULT 'healthy'
            );
CREATE TABLE scheduled_jobs (
                job_id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_name TEXT NOT NULL UNIQUE,
                description TEXT,
                file_a TEXT NOT NULL,
                file_b TEXT NOT NULL,
                num_columns INTEGER NOT NULL,
                expected_combinations TEXT,
                excluded_combinations TEXT,
                working_directory TEXT,
                schedule_type TEXT NOT NULL,
                schedule_config TEXT NOT NULL,
                enabled INTEGER DEFAULT 1,
                last_run_time TEXT,
                last_run_id INTEGER,
                last_run_status TEXT,
                next_run_time TEXT,
                created_by TEXT DEFAULT 'system',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                retry_count INTEGER DEFAULT 3,
                retry_delay_minutes INTEGER DEFAULT 15,
                notification_emails TEXT,
                notification_webhooks TEXT
            );
CREATE TABLE job_execution_history (
                execution_id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                run_id INTEGER,
                start_time TEXT NOT NULL,
                end_time TEXT,
                status TEXT NOT NULL,
                error_message TEXT,
                duration_seconds INTEGER,
                triggered_by TEXT DEFAULT 'scheduler',
                FOREIGN KEY (job_id) REFERENCES scheduled_jobs(job_id),
                FOREIGN KEY (run_id) REFERENCES runs(run_id)
            );
CREATE TABLE notification_config (
                config_id INTEGER PRIMARY KEY AUTOINCREMENT,
                config_type TEXT NOT NULL,
                config_name TEXT NOT NULL UNIQUE,
                config_value TEXT NOT NULL,
                is_sensitive INTEGER DEFAULT 0,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
CREATE TABLE notification_history (
                notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
                notification_type TEXT NOT NULL,
                recipient TEXT NOT NULL,
                subject TEXT,
                message TEXT,
                run_id INTEGER,
                status TEXT NOT NULL,
                error_message TEXT,
                sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES runs(run_id)
            );
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('runs',19);
INSERT INTO sqlite_sequence VALUES('job_stages',123);
INSERT INTO sqlite_sequence VALUES('comparison_export_files',32);
CREATE INDEX idx_comparison_run 
        ON comparison_summary(run_id)
    ;
CREATE INDEX idx_comparison_results_lookup 
        ON comparison_results(run_id, column_combination, category, position)
    ;
CREATE INDEX idx_comparison_results_category 
        ON comparison_results(run_id, column_combination, category)
    ;
CREATE INDEX idx_export_files_run 
        ON comparison_export_files(run_id, column_combination)
    ;
CREATE INDEX idx_export_files_chunk 
        ON comparison_export_files(run_id, column_combination, category, chunk_index)
    ;
COMMIT;
