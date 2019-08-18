exports.up = pgm => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });
  pgm.addColumns("events", {
    uuid: { type: "uuid", notNull: true, default: pgm.func('uuid_generate_v4()') }
  });
};