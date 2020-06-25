if (process.env.NODE_ENV === 'development') {
  require('trace');
  require('clarify');
}

const chalk = require('chalk');
const minimist = require('minimist');

const packageJson = require('./package.json');
const args = minimist(process.argv);

function showHelp () {
  console.log(`
  ${chalk.green(chalk.bold('📦 Bitabase'))}-${chalk.green('Server')} ${chalk.green(`- v${packageJson.version}`)}
The scalable, sharded database engine.
https://docs.bitabase.com

The following commands and arguments are available when starting Bitabase

Commands:
  start                            Start the bitabase server stack
    --advertise-host               Hostname to advertise to others (default: --bind-host)
    --bind-host                    Hostname to bind server to (default: 0.0.0.0)
    --bind-port                    Port to bind server to (default: 8000)
    --rqlite-addr                  Path to contact rqlite
    --database-path                Where to store rqlite transaction log (default: /tmp/sqlite-bitabase)
    --database-keep-alive          How long to keep sqlite database connections alive
  `.trim() + '\n');
}

function main () {
  if (args.help || args._.length === 2) {
    showHelp();
    console.log(chalk.red('No command specified'));
    process.exit(1);
  }

  if (args._[2] === 'start') {
    const createServer = require('./server');

    createServer({
      ...args,
      advertiseHost: args['advertise-host'],
      bindHost: args['bind-host'],
      bindPort: args['bind-port'],
      rqliteAddr: args['rqlite-addr'],
      databasePath: args['database-path'],
      databaseKeepAlive: args['database-keep-alive']
    }).start();

    return;
  }

  showHelp();
  console.log(args);
  console.log(chalk.red(`Unknown command "${args._[2]}"`));
  process.exit(1);
}

main();
