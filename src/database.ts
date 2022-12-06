import { Pool } from 'pg';
import type { Competition, Person, Player, Team } from './football-data';

const db = new Pool();

const getInsertQuery = <T>(tableName: string, elements: T[]) => {
  const columns = Object.keys(elements[0] || {}) as (keyof T)[];
  const values = elements
    .map((element) => `(${columns.map((key) => JSON.stringify(element[key])).join(', ')})`)
    .join(',')
    .replaceAll(`'`, `''`)
    .replaceAll(`"`, `'`);
  const onConflict = columns
    .slice(1)
    .map((c) => `excluded.${c.toString()}`)
    .join(', ');
  const query = `INSERT INTO ${tableName} (${columns.join(', ')})
VALUES ${values}
ON CONFLICT (id) DO UPDATE SET (${columns.slice(1).join(', ')}) = (${onConflict});`;
  return query;
};

export const insertCompetitions = async (competitions: Competition[]) => {
  return db.query(
    getInsertQuery(
      'competitions',
      competitions.map(({ id, name, code, area }) => ({ id, name, code, area_name: area.name }))
    )
  );
};

const insertCompetitionTeamRelations = async (competitionId: number, teams: Team[]) => {
  const elements = teams.map((team) => ({
    id: competitionId * team.id,
    competition_id: competitionId,
    team_id: team.id,
  }));
  return db.query(getInsertQuery('competition_team', elements));
};

export const insertTeams = async (competitionId: number, teams: Team[]) => {
  const result = await db.query(
    getInsertQuery(
      'teams',
      teams.map(({ id, name, tla, shortName, area, address }) => ({
        id,
        name,
        tla,
        short_name: shortName,
        area_name: area.name,
        address,
      }))
    )
  );
  await insertCompetitionTeamRelations(competitionId, teams);
  return result;
};

export const insertPersons = async (teamId: number, persons: (Person | Player)[]) => {
  const elements = persons.map((person) => {
    const type = 'position' in person ? 'player' : 'coach';
    const position = 'position' in person ? person.position : null;
    return {
      id: person.id,
      team_id: teamId,
      name: person.name,
      position,
      date_of_birth: person.dateOfBirth,
      nationality: person.nationality,
      type,
    };
  });
  return db.query(getInsertQuery('persons', elements));
};

export const getPlayersOrCoach = async (leagueCode: string, teamName?: string) => {
  const existsLeague = (await db.query(`SELECT * FROM competitions WHERE code = '${leagueCode}'`)).rowCount > 0;
  if (!existsLeague) throw new Error('No competition with that leagueCode');
  const query = `
SELECT p.id, p.name, p.position, p.date_of_birth, p.nationality, p.type, tt.team, tt.competition
FROM persons p
JOIN (
  SELECT t.id, t.name as team, comp.competition_name as competition
  FROM teams t
  JOIN (
    SELECT ct.team_id, c.name as competition_name
    FROM competition_team ct
    JOIN (
      SELECT *
      FROM competitions
      WHERE code = '${leagueCode}'
    ) c
    ON c.id = ct.competition_id
  ) comp
  ON t.id = comp.team_id
  ${teamName ? `WHERE t.name = '${teamName}'` : ''}
) tt
ON p.team_id = tt.id
`;
  const result = await db.query(query);
  const rows = result.rows as {
    id: number;
    name: string;
    position: string;
    date_of_birth: string;
    nationality: string;
    type: string;
    team: string;
    competition: string;
  }[];
  return rows.map(({ date_of_birth, type, ...row }) => ({
    ...row,
    dateOfBirth: date_of_birth,
    type: type.toUpperCase(),
  }));
};

export const getTeamPlayers = async (teamName: string) => {
  const teamQuery = `SELECT * FROM teams WHERE name = '${teamName}'`;
  const { short_name, area_name, ...team } = (await db.query(teamQuery)).rows[0] as {
    id: number;
    name: string;
    tla: string;
    short_name: string;
    area_name: string;
    address: string;
  };
  const playersQuery = `
SELECT p.id, p.name, p.position, p.date_of_birth, p.nationality, p.type, tt.team, tt.competition
FROM persons p
JOIN (
  SELECT t.id, t.name as team, comp.competition_name as competition
  FROM teams t
  JOIN (
    SELECT ct.team_id, c.name as competition_name
    FROM competition_team ct
    JOIN competitions c
    ON c.id = ct.competition_id
  ) comp
  ON t.id = comp.team_id
  WHERE t.name = '${teamName}'
) tt
ON p.team_id = tt.id
`;
  const result = await db.query(playersQuery);
  const players = (
    result.rows as {
      id: number;
      name: string;
      position: string;
      date_of_birth: string;
      nationality: string;
      type: string;
      team: string;
      competition: string;
    }[]
  ).map(({ date_of_birth, type, ...row }) => ({
    ...row,
    dateOfBirth: date_of_birth,
    type: type.toUpperCase(),
  }));
  return { players, shortName: short_name, areaName: area_name, ...team };
};
