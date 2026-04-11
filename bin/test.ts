import { assert } from '@t8ngs/assert'
import { spec, dot } from '@t8ngs/runner/reporters'
import { configure, processCLIArgs, run } from '@t8ngs/runner'

/*
|--------------------------------------------------------------------------
| Configure tests
|--------------------------------------------------------------------------
|
| The configure method accepts the configuration to configure the T8ngs
| tests runner.
|
| The first method call "processCliArgs" process the command line arguments
| and turns them into a config object. Using this method is not mandatory.
|
| Please consult japa.dev/runner-config for the config docs.
*/
processCLIArgs(process.argv.splice(2))
configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [assert()],
  reporters: {
    activated: ['spec'],
    list: [spec(), dot()],
  },
})

/*
|--------------------------------------------------------------------------
| Run tests
|--------------------------------------------------------------------------
|
| The following "run" method is required to execute all the tests.
|
*/
run()