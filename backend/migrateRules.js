const fs = require("fs");

const db = require("./db/database");

const RULES_FILE =
  "E:/projects/wa-data/rules.json";

const rules = JSON.parse(
  fs.readFileSync(RULES_FILE, "utf8")
);

const insert = db.prepare(`
  INSERT OR REPLACE INTO rules (
    id,
    keyword,
    matchType,
    targetContact,
    reply,
    isActive
  )
  VALUES (
    @id,
    @keyword,
    @matchType,
    @targetContact,
    @reply,
    @isActive
  )
`);

const transaction = db.transaction(data => {

  for (const rule of data) {

    insert.run({
      id: rule.id,
      keyword: rule.keyword,
      matchType: rule.matchType,
      targetContact:
        rule.targetContact || "all",
      reply: rule.reply,
      isActive:
        rule.isActive ? 1 : 0
    });

  }

});

transaction(rules);

console.log(
  `Imported ${rules.length} rules`
);