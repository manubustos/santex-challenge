Este repositorio es un la solución a un challenge de reclutamiento de Santex ([PDF](./docs/Challenge.pdf))

## Requisitos

- Docker

## Usando

Para poder correr el servidor de GraphQL solo se tiene que abrir la consola en el directorio raíz y correr (con docker abierto) el comando:

> docker compose up

Docker se encargará de instalar todas las dependencias y de iniciar el programa.

## Explicación

La implementación se realizo usando 3 contenedores de docker:

- postgres: Este contenedor es el que se instancia primero y contiene la base de datos de postgres que cuenta con 4 tablas:

  - competitions
  - teams
  - competition_team: Tabla que representa la unión entre cada competition y team..
  - persons: Tabla con los jugadores y los entrenadores.

- pgadmin4: Contenedor que corre pgadmin4 para visalizar los datos de las tablas más comodamente. Para poder utilizarlo se debe:

  1. Ingresar a http://localhost:5050
  2. Loguearse con el usuario "admin@admin.com" y la contraseña "admin"
  3. Agregar servidor con "Add new server"
  4. Llenar las casillas como se puede ver en las imágenes [pgadmin-1](./docs/pgadmin-1.png) y [pgadmin-2](./docs/pgadmin-2.png) y clicker en "Save"
  5. Ya se pueden hacer consultas yendo a "Tools" > "Query Tool" en la barra de tareas

- api: Este contenedor usa el paquete "apollo-server", que es un servidor de GraphQL, y el paquete "pg" para realizar las consultas SQL a la base de datos. Usando apollo se implementan la mutación para la carga de datos, los querys para consultarlos y además cuenta con una herramienta de UI que se puede acceder ingresando a http://localhost:4000. Desde esa UI se pueden hacer todas las query y la mutación de GraphQL
