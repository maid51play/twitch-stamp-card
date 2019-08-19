exports.up = pgm => {
  pgm.dropColumns("events", ["uuid", "game"]);
  pgm.addColumns("events", {
    streamId: { type: "integer" }
  })
  pgm.dropExtension('uuid-ossp', { ifNotExists: true });
};