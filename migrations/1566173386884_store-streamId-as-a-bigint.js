exports.up = (pgm) => {
  pgm.alterColumn("events", "streamId", {type: "bigint"})
};