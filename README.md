# Rap CLI

[![Build Status](https://travis-ci.com/dev-talentseer/rap-cli.svg?token=CxF1Zpd3y8pJALXJ5RiT&branch=master)](https://travis-ci.com/dev-talentseer/rap-cli)

CLI tool to create serverless project base on dawan-template.

Integration: Travis CI, Commitizen, Serverless

## Prerequisite

   [Travis CI CLI Documentation](https://github.com/travis-ci/travis.rb)

```bash
brew install ruby
gem install travis -v 1.8.10 --no-rdoc --no-ri
travis login --pro
```

   [Commitizen documentation](https://github.com/commitizen/cz-cli)

```bash
npm install -g commitizen
```

## Installation

```bash
npm install -g @rap/rap-cli&&npm link
```

## Usage

```bash
rap init example
```

### Domain

If enter `example.com` as domain and skipped basePath, the service will be deployed to:

| Stage | Link |
| --- | --- |
| `dev` | <https://dev-api.example.com/api/hello-world> |
| `prod` | <https://api.example.com/api/hello-world> |

## Configuration

### `.env` file

Will be used for serverless offline environment and Travis CI environment.

```bash
DB_CONNECTION_STRING='<YOUR DB CONN STRING HERE>'
AWS_ACCESS_KEY_ID='<YOUR AWS ACCESS KEY ID HERE>'
AWS_SECRET_ACCESS_KEY='<YOUR AWS SECRET ACCESS KEY HERE>'
```

## Access Environment Variables

Access database connection strings in your code with `${process.env.DB_CONNECTION_STRING}`

Access stage (dev or prod) with `${process.env.STAGE}`
