# Git — règles d’équipe

## Branches

```
main
 └── dev
       ├── imma_frontend
       ├── uriel_backend
       └── farid_ml
```

`main` : versions stables.  
`dev` : intégration.  
Chacun développe sur sa branche, issue de `dev`.

Branche optionnelle : `bienv_architecture` pour les changements transverses, merger dans `dev`.

## Routine

```bash
git checkout dev
git pull origin dev
git checkout <votre_branche>
git merge dev
```

Puis commits, tests, `git push -u origin <votre_branche>`.

Intégration : PR (ou merge) **vers `dev`**, pas directement vers `main`.

## Propriété des dossiers

Éviter les diffs hors de son dossier sauf accord.

## Messages

`feat|fix|docs|chore|test|refactor(<scope>): description`
