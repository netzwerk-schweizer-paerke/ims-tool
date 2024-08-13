Swiss Parcs Network

# IMS Tool

### Description

This tool is used by swiss parcs to document their processes. It is a multi-tenant, Payload 3 based, application where
each parc is represented as an organisation with their own users and processes.

### Installation

See `/docker-compose/docker-compose.yml` for the services that are required to run the application.

### Configuration

Configuration is done via environment variables. Check `/docker-compose/.env.template` for the environment variables that are required.
You should copy this file to `/docker-compose/.env` and fill in the values prior to running the application.

### License

This application is based on Payload CMS 3.x and the code in this repository is hereby licensed under the MIT license.

### Credits

This application was developed by [Tegonal Cooperative](https://tegonal.com) for Swiss Parcs Network.
