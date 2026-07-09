const db = require("../db/database");

function getRules() {
  return db
    .prepare(`
      SELECT *
      FROM rules
      ORDER BY id DESC
    `)
    .all()
    .map(rule => ({
      ...rule,
      isActive: Boolean(rule.isActive)
    }));
}

function saveRules(rules) {
  const clear = db.prepare("DELETE FROM rules");

  const insert = db.prepare(`
    INSERT INTO rules (
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
    clear.run();
    for (const rule of data) {
      insert.run({
        ...rule,
        isActive: rule.isActive ? 1 : 0
      });
    }
  });

  transaction(rules);
}

module.exports = {
  getRules,
  saveRules
};