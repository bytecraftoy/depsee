import {getConfig} from './configs';
import {Pool, QueryConfig} from 'pg'; //PoolConfig was unused
import { migrate } from "postgres-migrations";

class Database {
	private _pool: Pool | null = null;

  //Below comment will remove the eslint error, but maybe it should be
  //handled in another way.
  // /* eslint-disable @typescript-eslint/no-explicit-any*/
  async query(text: string | QueryConfig<any>, params: unknown[]) {
    const start = Date.now();
    console.log("Text: ", text)
    console.log("Params: ", params)
    const pool = await this.getPool();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  }

  async getClient() {
    const pool = await this.getPool();
    const client = await pool.connect();
    return client;
  }

  async getPool(): Promise<Pool> {
    if (!this._pool) {
      const config = await getConfig();
      this._pool = new Pool(config.poolConfig);
    }

    return this._pool;
  }
}
 
const db = new Database();
db.getClient().then((client) => { 
  console.log("running migrations");
  migrate({ client }, "./migrations").catch( async () => { 
    console.log("migration failed, dropping all tables");
    //migration failed, probably because of existing data
    //therefore, during development, drop all tables and try again
    await client.query(
      `DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
      COMMENT ON SCHEMA public IS 'standard public schema';`
    );

    console.log("rerunning migrations");
    return migrate({client}, "./migrations");
  }).then(() => { console.log("migrations done"); }); 
});

export { db };