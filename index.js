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
                name: 'description',
                message: 'enter a description (optional)'
            },
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
                message: 'enter the runtime for this service [default: nodejs10.x] (optional)'
            }
        ]).then((answers) => {
            const spinner = ora('downloading template...');
            spinner.start();
            download('github:dev-talentseer/dawan-template', name, { clone: true }, (err) => {
                if (err) {
                    spinner.fail();
                    console.log(chalk.bold.red('error downloading template file'));
                    console.log(symbols.error, chalk.bold.red('project creating failed!'));
                    return 1;
                }
                spinner.succeed();
                const meta = {
                    name,
                    description: answers.description || ''
                };

                const configSpinner = ora('creating .env file...');
                configSpinner.start();
                try {
                    const domain = answers.domain || 'example.com';
                    const basePath = answers.basePath || 'api';
                    const runtime = answers.runtime || 'nodejs10.x';

                    const variables = `DB_CONNECTION_STRING=''
AWS_ACCESS_KEY_ID=''
AWS_SECRET_ACCESS_KEY=''
DOMAIN='${domain}'
BASE_PATH='${basePath}'
RUNTIME='${runtime}'`;
                    fs.writeFileSync(`${name}/.env`, variables)
                } catch (error) {
                    configSpinner.fail();
                    console.log(chalk.bold.red('error creating .env file'));
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
                    console.log(symbols.error, chalk.bold.red('project creating failed!'));
                    return 1;
                }
                pkgSpinner.succeed();


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
                    console.log(error);
                    console.log(chalk.bold.red('error creating pre-push git hook'));
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