import nodeFetch from 'node-fetch';

export interface Competition {
  id: number;
  area: { name: string };
  code: string;
  name: string;
  type: 'CUP' | 'LEAGUE' | 'SUPER_CUP' | 'PLAYOFFS';
}

export interface Person {
  id: number;
  name: string;
  dateOfBirth: string;
  nationality: string;
}

export interface Player extends Person {
  position: string;
}

export interface Team {
  id: number;
  area: { name: string };
  name: string;
  shortName: string;
  tla: string;
  address: string;
  coach: Person;
  squad: Player[];
}

const sleep = (ms: number) => {
  console.log(`Waiting ${ms} ms`);
  return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
};

export class FootballAPI {
  private baseUrl = 'http://api.football-data.org';
  private apiKey = 'fdba6687dfb245a79dcecde6b3f7a26e';
  private headers = { 'X-Auth-Token': this.apiKey, Authorization: this.apiKey };
  private requestsAvailable = 10;
  private nextCounterReset = new Date(Date.now() + 60 * 1000);

  private async apiCall<T>(url: string) {
    if (this.requestsAvailable === 0) await sleep(this.nextCounterReset.getTime() - Date.now());
    return nodeFetch(url, { method: 'GET', headers: this.headers })
      .then((res) => {
        this.requestsAvailable = Number(res.headers.get('x-requests-available-minute'));
        if (this.requestsAvailable === 0) {
          const secondsTillCounterReset = Number(res.headers.get('x-requestcounter-reset')) || 60;
          this.nextCounterReset = new Date(Date.now() + secondsTillCounterReset * 1000);
        }
        return res.json() as Promise<T | { message: string; errorCode: number }>;
      })
      .then((res) => {
        if ('message' in res) throw new Error(res.message);
        return res;
      });
  }

  async getCompetition(competitionCode: string) {
    return this.apiCall<Competition>(`${this.baseUrl}/v4/competitions/${competitionCode}`);
  }

  async getCompetitions() {
    return this.apiCall<{ competitions: Competition[] }>(`${this.baseUrl}/v4/competitions`);
  }

  async getCompetitionTeams(competitionId: number) {
    return this.apiCall<{ teams: Team[] }>(`${this.baseUrl}/v4/competitions/${competitionId}/teams`);
  }
}
