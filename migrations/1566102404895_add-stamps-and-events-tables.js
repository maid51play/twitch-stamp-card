exports.up = pgm => {
  pgm.createTable("events", {
    id: "id",
    title: { type: "text" },
    game: { type: "text" },
    status: { type: "varchar(255)", notNull: true },
    createdAt: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });
  pgm.createTable("stamps", {
    id: "id",
    twitchUserId: { type: "integer", notNull: true },
    eventId: { 
      type: "integer",
      notNull: true,
      references: '"events"',
      onDelete: "cascade" },
    createdAt: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });
  pgm.createIndex("stamps", "eventId");
};