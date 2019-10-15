exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("stamps", {
    archived: { type: "boolean", notNull: true, default: false }
  })
};

exports.down = (pgm) => {
  pgm.dropColumns("stamps", "archived", {})
};
