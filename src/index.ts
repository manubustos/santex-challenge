import { readFileSync } from 'fs';

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { FootballAPI } from './football-data';
import { getPlayersOrCoach, getTeamPlayers, insertCompetitions, insertPersons, insertTeams } from './database';

interface Context {
  footballAPI: FootballAPI;
}

const typeDefs = readFileSync('./schema.graphql').toString();

const importLeague = async (_: any, { leagueCode }: { leagueCode: string }, { footballAPI }: Context) => {
  const competition = await footballAPI.getCompetition(leagueCode);
  const { teams } = await footballAPI.getCompetitionTeams(competition.id);
  await insertCompetitions([competition]);
  await insertTeams(competition.id, teams);
  await Promise.all(
    teams.map(({ squad, coach, ...team }) => insertPersons(team.id, squad.length > 0 ? squad : [coach]))
  );
  return true;
};

const resolvers = {
  Mutation: {
    importLeague,
  },
  Query: {
    players: async (_: any, { leagueCode, teamName }: { leagueCode: string; teamName?: string }) =>
      getPlayersOrCoach(leagueCode, teamName),
    team: async (_: any, { teamName }: { teamName: string }) => getTeamPlayers(teamName),
  },
};

const server = new ApolloServer<Context>({ typeDefs, resolvers });

startStandaloneServer(server, {
  listen: { port: 4000 },
  async context() {
    return { footballAPI: new FootballAPI() };
  },
}).then(({ url }) => console.log(`Server listening at: ${url}`));
