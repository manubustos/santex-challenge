/* Create competitions table in public schema */
CREATE TABLE public.competitions (
    id INTEGER PRIMARY KEY,
    code TEXT,
    name TEXT,
    area_name TEXT
);

/* Create teams table in public schema */
CREATE TABLE public.teams (
    id INTEGER PRIMARY KEY,
    name TEXT,
    tla TEXT,
    short_name TEXT,
    area_name TEXT,
    address TEXT
);

/* Create copetition and team connection table in public schema */
CREATE TABLE public.competition_team (
    id INTEGER PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions NOT NULL,
    team_id INTEGER REFERENCES teams NOT NULL
);
CREATE INDEX competition_team_competition_index ON public.competition_team (competition_id);
CREATE INDEX competition_team_team_index ON public.competition_team (team_id);

CREATE TYPE PERSONTYPE AS ENUM ('PLAYER', 'COACH');

/* Create persons table in public schema */
CREATE TABLE public.persons (
    id INTEGER PRIMARY KEY,
    team_id INTEGER REFERENCES teams NOT NULL,
    name TEXT,
    position TEXT,
    date_of_birth DATE,
    nationality TEXT,
    type PERSONTYPE
);
CREATE INDEX person_team_index ON public.persons (team_id);
