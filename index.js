#!/usr/bin/env node
const program = require('commander');
const download = require('download-git-repo');
const inquirer = require('inquirer');
const fs = require('fs');
const handlebars = require('handlebars');
const chalk = require('chalk');
const ora = require('ora');
const symbols = require('log-symbols');

program.version('1.0.0', '-v, --version')
    .command('init <name>')
    .description(chalk.green('Initialize a new project with dawan-template'))
    .action((name) => {
        if (fs.existsSync(name)) {
            // console.log(warning(`Target directory ${name} already exist.`));
            console.log(chalk.bold.red('target directory exist'));
            console.log(symbols.error, chalk.bold.red('project creating failed!'));
            return 1;
        }
        inquirer.prompt([
            {
                name: 'domain',
                message: 'enter the domain you want to use [default: example.com] (optional)'
            },
            {
                name: 'basePath',
                message: 'enter the basePath for this service [default: api] (optional)'
            },
            {
                name: 'runtime',
                type: 'list',
                choices: [
                    "nodejs",
                    "python",
                ],
                filter: val => val.toLowerCase(),
                message: 'select the runtime for this service'
            }
        ]).then((answers) => {
            const spinner = ora('downloading template...');
            spinner.start();
            download('github:dev-talentseer/dawan-template', name, { clone: true }, (err) => {
                if (err) {
                    spinner.fail();
                    console.log(chalk.bold.red('error downloading template file'));
                    console.log(`error message: ${err}`);
                    console.log(symbols.error, chalk.bold.red('project creating failed!'));
                    return 1;
                }
                spinner.succeed();
                const meta = {
                    name,
                    description: 'Created with @yong-talentseer/rap-cli.'
                };

                const configSpinner = ora('creating .env file...');
                configSpinner.start();
                const runtimes = { 'nodejs': 'nodejs10.x', 'python': 'python3.7' }
                const domain = answers.domain || 'example.com';
                const basePath = answers.basePath || 'api';
                const chosenRuntime = answers.runtime || 'nodejs'
                const runtime = runtimes[chosenRuntime];
                try {
                    const variables = `DB_CONNECTION_STRING=''
AWS_ACCESS_KEY_ID=''
AWS_SECRET_ACCESS_KEY=''
`;
                    fs.writeFileSync(`${name}/.env`, variables)
                    const fileNames = { 'nodejs': 'handler.js', 'python': 'handler.py' };
                    Object.keys(fileNames).forEach(k => k === chosenRuntime ? console.log(k) : fs.unlinkSync(`${name}/${fileNames[k]}`));

                } catch (error) {
                    configSpinner.fail();
                    console.log(chalk.bold.red('error creating .env file', error));
                    console.log(`error message: ${error}`);
                    console.log(symbols.error, chalk.bold.red('project creating failed!'));
                    return 1;
                }
                configSpinner.succeed();

                const pkgSpinner = ora('creating package.json file from template...');
                pkgSpinner.start();
                try {
                    const fileName = `${name}/package.json`;
                    const content = fs.readFileSync(fileName).toString();
                    const result = handlebars.compile(content)(meta);
                    fs.writeFileSync(fileName, result);
                } catch (error) {
                    pkgSpinner.fail();
                    console.log(chalk.bold.red('error creating package.json file'));
                    console.log(`error message: ${error}`);
                    console.log(symbols.error, chalk.bold.red('project creating failed!'));
                    return 1;
                }
                pkgSpinner.succeed();

                const ymlSpinner = ora('updating serverless.yml file from template...');
                ymlSpinner.start();
                try {
                    const fileName = `${name}/serverless.yml`;
                    const content = fs.readFileSync(fileName).toString();
                    const result = handlebars.compile(content)({ name: meta.name, runtime: runtime, domain: domain, basePath: basePath });
                    fs.writeFileSync(fileName, result);
                } catch (error) {
                    ymlSpinner.fail();
                    console.log(chalk.bold.red('error updating serverless.yml file'));
                    console.log(`error message: ${error}`);
                    console.log(symbols.error, chalk.bold.red('project creating failed!'));
                    return 1;
                }
                ymlSpinner.succeed();

                const readmeSpinner = ora('creating README.md file from template...');
                readmeSpinner.start();
                try {
                    const fileName = `${name}/README.md`;
                    const content = fs.readFileSync(fileName).toString();
                    const result = handlebars.compile(content)({ name: meta.name });
                    fs.writeFileSync(fileName, result);
                } catch (error) {
                    readmeSpinner.fail();
                    console.log(chalk.bold.red('error creating README.md file'));
                    console.log(`error message: ${error}`);
                    console.log(symbols.error, chalk.bold.red('project creating failed!'));
                    return 1;
                }
                readmeSpinner.succeed();

                const hookSpinner = ora('creating pre-push git hook...');
                hookSpinner.start();
                try {
                    const dir = `${name}/.git/hooks`;
                    fs.mkdirSync(dir, { recursive: true });
                    const hookFileName = `${dir}/pre-push`;
                    const scriptContent = `#!/bin/bash
# read config
source .env

if [ -z \${DB_CONNECTION_STRING} ]; then echo "DB_CONNECTION_STRING is unset" && exit 1; else travis env set DB_CONNECTION_STRING \${DB_CONNECTION_STRING}; fi
if [ -z \${AWS_ACCESS_KEY_ID} ]; then echo "AWS_ACCESS_KEY_ID is unset" && exit 1; else travis env set AWS_ACCESS_KEY_ID \${AWS_ACCESS_KEY_ID}; fi
if [ -z \${AWS_SECRET_ACCESS_KEY} ]; then echo "AWS_SECRET_ACCESS_KEY is unset" && exit 1; else travis env set AWS_SECRET_ACCESS_KEY \${AWS_SECRET_ACCESS_KEY}; fi
if [ -z \${DOMAIN} ]; then echo "DOMAIN is unset" && exit 1; else travis env set DOMAIN \${DOMAIN}; fi
if [ -z \${BASE_PATH} ]; then echo "BASE_PATH is unset" && exit 1; else travis env set BASE_PATH \${BASE_PATH}; fi
if [ -z \${RUNTIME} ]; then echo "RUNTIME is unset" && exit 1; else travis env set RUNTIME \${RUNTIME}; fi
`;
                    fs.writeFileSync(hookFileName, scriptContent, { mode: 0o777 });
                } catch (error) {
                    hookSpinner.fail();
                    console.log(chalk.bold.red('error creating pre-push git hook'));
                    console.log(`error message: ${error}`);
                    console.log(symbols.error, chalk.bold.red('project creating failed!'));
                    return 1;
                }
                hookSpinner.succeed();
                console.log(symbols.success, chalk.green('project created successfully! skr skr'));

            })
        })
    });
program.parse(process.argv);

// Check the program.args obj
var NO_COMMAND_SPECIFIED = program.args.length === 0;

// Handle it however you like
if (NO_COMMAND_SPECIFIED) {
    // e.g. display usage
    program.help();
}