exports.up = (pgm) => {
  pgm.addConstraint( "stamps", "unique stamps", 'UNIQUE ("twitchUserId","eventId")' )
};

