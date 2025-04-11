# InventoryPilot - https://inventory-pilot.vercel.app/

## Release Demo
**https://drive.google.com/file/d/1A0P-mhyDx5q1hXIzOz_FQGD1S1wqSAA2/view?usp=sharing**

## Top 5 most important files 

| File path with clickable GitHub link | Purpose | 
|--------------------------------------|----------|
| [orders.views.py](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/backend/orders/views.py) | Core feature logic of generating inventory pick list and manufacturing list | 
| [inventory.views.py](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/backend/inventory/views.py) | Core feature logic of assigning an order picklist to a staff member |
| [backend.celery.py](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/backend/backend/celery.py) | Core feature logic of generating manufacturing list schedule |
| [inventory-stock/App.tsx](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/frontend/src/components/inventory-stock/App.tsx) | Displays the warehouse inventory stock |
| [InventoryPickListItem.jsx](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/frontend/src/components/orders/InventoryPickListItem.jsx) | Displays the main UI picker staffs will use | 

## Top 5 most important tests 
| File path with clickable GitHub link | Purpose | 
|-|-|
|[orders.tests.py](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/backend/orders/tests.py) | Test for manufacturing list and inventory pick list generation backend logic | 
|[inventory.tests.py](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/backend/inventory/tests.py) | Test for inventory stock levels manipulation | 
|[admin_dashboard.tests.py](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/backend/admin_dashboard/tests.py) | Test for user creation,user info manipulation, and user role management  | 
|[auth_app.tests.py](https://github.com/Irisvella/InventoryPilot/blob/main/WarehousePilot_app/backend/auth_app/tests.py) | Test for authentication of users and authentication related functions  | 
|[UI testing](https://github.com/Irisvella/InventoryPilot/issues/195) | UI Testing for the frontend  | 

![Python](https://img.shields.io/badge/Python-blue?style=flat&logo=python)
![Django](https://img.shields.io/badge/Django-green?style=flat&logo=django)
![pip](https://img.shields.io/badge/pip-orange?style=flat&logo=python)
![JavaScript](https://img.shields.io/badge/JavaScript-yellow?style=flat&logo=javascript)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat&logo=typescript)
![React](https://img.shields.io/badge/React-blue?style=flat&logo=react)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-teal?style=flat&logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-blue?style=flat&logo=docker)
![GitHub](https://img.shields.io/badge/GitHub-black?style=flat&logo=github)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-grey?style=flat&logo=githubactions)
![Visual Studio Code](https://img.shields.io/badge/VS%20Code-blue?style=flat&logo=visualstudiocode)

## Description
**InventoryPilot** is a tailored solution for [Concept Store Fixtures (CSF) International](https://www.conceptfixtures.com/en/home/)  , the leading manufacturer of aftermarket parts and accessories in North America. Known for fast lead times and competitive pricing, CSF requires streamlined production and operations management. InventoryPilot automates task allocation, optimizes machine utilization, tracks live inventory, and provides a real-time management dashboard, enhancing efficiency and ensuring production goals are met effectively.

## Team Members

| Name                     | ID         | GitHub ID             | Email                        |
|--------------------------|------------|-----------------------|------------------------------|
| Andy Sun                | 40192040   | Irisvella             | Andysunham@gmail.com         |
| Christa Abou-Arraje     | 40226631   | christa-ux            | christa.arraj@gmail.com      |
| Fatoumata Binta Barry   | 40213443   | Fatoumatabintabarry   | bintabarry2002@yahoo.ca      |
| Flora Avakian           | 40158192   | flo351                | flora.avakian@yahoo.ca       |
| Inas Fawzi              | 40208675   | inas-fawzi            | inasfawzi24@gmail.com        |
| Megan Coscia            | 40214186   | m-coscia              | meg.coscia@gmail.com         |
| Nour Hadie Hassoun      | 40233077   | iluvpesto             | n_hassoun3@hotmail.com       |
| Sarah Abellard          | 40184667   | sarahabellard         | sarahzinea@gmail.com         |
| Suha Abubakr            | 40120785   | suha-ab               | abubakr.suha@gmail.com       |
| Yousef Enein            | 40115494   | yousefenein           | yousefenein@outlook.com      |
| James Bitharas          | 26637175   | strikeyamato          | jamesbitharas@gmail.com      |


## Developer getting started guide
### Prerequisites
- Python 3.10 or later
- Node.js 16.x or later

### clone the repository


```
git clone https://github.com/christa-ux/InventoryPilot.git
```



<ins>Note:</ins> To run the backend and frontend, you should run two shells simultaneously. The first shell is for the backend and runs python. The second shell is for the frontend and runs node.

### To run the backend
```
cd WarehousePilot_app\backend
```
```
pip install -r requirements.txt
```
```
create the .env file and add the environment variables
```
```
python manage.py migrate
```
To run server:
```
python manage.py runserver
```

### For frontend
```
cd WarehousePilot_app
```
```
cd frontend
```
To download front-end dependencies: nextUI, reactJS, TailwindCSS, chartJS, heroicon, vite)
```
npm install 
```
```
add the .env.development file to connect to the backend 
```
```
npm run dev
```
```
control click on the localhost to open the webpage
```
### To run as a Docker container
Make sure to have Docker for desktop installed [here](https://www.docker.com/get-started/).

Add the .env file in the root directory and build your images and container using
```
docker-compose build
```
You can run the command below and control-click on local host to open the webpage
```
docker-compose up
```


## Wiki table of contents
- [Collection of All Meeting Minutes](https://github.com/christa-ux/InventoryPilot/wiki/Collection-of-All-Meeting-Minutes)
- [Documentation of Stakeholder Meetings](https://github.com/christa-ux/InventoryPilot/wiki/Documentation-of-Stakeholder-Meetings)
- [Risks](https://github.com/christa-ux/InventoryPilot/wiki/Risks)
- [Legal and Ethical Issues](https://github.com/christa-ux/InventoryPilot/wiki/Legal-and-Ethical-Issues)
- [Economic Impact](https://github.com/christa-ux/InventoryPilot/wiki/Economic-Impact)
- [Personas](https://github.com/christa-ux/InventoryPilot/wiki/Personas)
- [Diversity statement](https://github.com/christa-ux/InventoryPilot/wiki/Diversity-Statement)
- [Overall Architecture and Class Diagrams](https://github.com/christa-ux/InventoryPilot/wiki/Overall-Architecture-and-ClassDiagrams)
- [Infrastructure and tools](https://github.com/christa-ux/InventoryPilot/wiki/Infrastructure-and-Tools)
- [Name Conventions](https://github.com/christa-ux/InventoryPilot/wiki/Name-Conventions)
- [Testing Plan and Continuous Integration](https://github.com/christa-ux/InventoryPilot/wiki/Testing-Plan-and-Continuous-Integration)
- [Security](https://github.com/christa-ux/InventoryPilot/wiki/Security)
- [Performance](https://github.com/christa-ux/InventoryPilot/wiki/Performance)
- [Deployment Plan and Infrastructure](https://github.com/christa-ux/InventoryPilot/wiki/Deployment-Plan-and-Infrastructure)
- [Next Iteration Plan and Rollout Strategy](https://github.com/christa-ux/InventoryPilot/wiki/Next-Iteration-Plan-and-Rollout-Strategy)



