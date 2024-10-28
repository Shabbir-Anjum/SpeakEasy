# BACKEND DOCS
### Use docker compose for running the backend image
#### Create and populate env files
* Copy /backend/.env.example in /backend/.env and populate the keys
* Copy /root/.env.example in /root/.env and populate the db keys
#### Build the docker images in compose file
* (sudo) docker compose build --no-cache        sudo is for super user on linux
#### Run the docker compose file
* (sudo) docker compose up -d

  ### Mapping of the ports and services:
| Folder        | Port |            Deployed           |
|---------------|------|-------------------------------|
|    backend    | 8001 |     https://intervuo.tech/    |
|   database    | 8080 |     https://intervuo.site/    |
|   frontend    | 3000 | https://voca-mind.vercel.app/ |
