const { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLSchema, GraphQLNonNull } = require("graphql");
const { redis } = require("../redis");

const NotificationType = new GraphQLObjectType({
  name: "Notification",
  fields: {
    message: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    read: { type: GraphQLString },
  },
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    notifications: {
      type: new GraphQLList(NotificationType),
      args: { userId: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (_, { userId }) => {
        const key = `notifications:user:${userId}`;
        const raw = await redis.lRange(key, 0, -1);
        return raw.map((msg) => JSON.parse(msg));
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
});
