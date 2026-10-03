# LinkedIn — film motion 45 s

Étude de motion design originale, pensée pour être publiée sur LinkedIn.
Ce n’est pas un film officiel de LinkedIn. Le monogramme **[in]** n’est pas reproduit : le nom est composé en Inter, et le bleu `#0A66C2` est la couleur publique de la marque.

## Format

Le fichier suit les spécifications vidéo de LinkedIn (pages d’aide « Video specifications » et « Video ads advertising specifications ») :

| Paramètre | Valeur | Pourquoi |
| --- | --- | --- |
| Fichier | `export/linkedin-45s-4x5.mp4` | MP4, seul conteneur des publicités vidéo |
| Codec | H.264 High, niveau 4.0, yuv420p | H.264 exigé |
| Image | **1080 × 1350** | Maximum du ratio **4:5**, indiqué comme ratio vertical recommandé |
| Images/s | **25** | Inférieur à 30, plafond des video ads, et dans la plage 10–60 de l’organique |
| Durée | **45,000 s** (1 125 images) | Demandée ; acceptée en fil et en in-stream (jusqu’à 90 s) |
| Audio | AAC-LC, 48 kHz, stéréo, 192 kb/s | AAC, sous 64 kHz |
| Débit | ~1 Mb/s en moyenne, plafond 14 Mb/s | Dans la plage 192 kb/s – 30 Mb/s |
| Poids | ~5,3 Mo | Sous 500 Mo (ads) et 5 Go (organique) |
| Faststart | oui | Lecture progressive |
| Sous-titres | `export/linkedin-45s-4x5.srt` | Fichier SRT à joindre à l’upload |
| Miniature | `export/thumbnail.jpg` | 1080 × 1350, JPG, même ratio que la vidéo |

Le texte est aussi incrusté : la plupart des vues LinkedIn se font sans son.

## Ce que raconte le film

Chiffres et formulations repris des sources publiques consultées en octobre 2026, surtout [About Us](https://news.linkedin.com/about-us) et l’historique public de l’entreprise.

1. Le plus grand réseau professionnel.
2. La mission : connecter les professionnels du monde.
3. Origine : 10 décembre 2002, Mountain View ; lancement public le 5 mai 2003 ; équipe fondatrice ; jalons jusqu’à l’introduction en Bourse, l’acquisition par Microsoft (26,2 milliards de dollars, 2016), le milliard de membres (novembre 2023) et 1,3 milliard en 2026.
4. 1,3 milliard de membres, plus de 200 pays et territoires, 5 ans de croissance à deux chiffres, 36 langues, environ 100 % du Fortune 500.
5. Chaque minute : 18 000+ connexions, ~8 200 candidatures, 93 nouveaux postes, 123 heures d’apprentissage, 1,8 million de vues du fil.
6. Le graphe économique par région, 19,8 milliards de dollars de revenu annuel, 42 000+ compétences, 144 000+ écoles.
7. La vision : une opportunité économique pour chaque membre de la population active mondiale.
8. Carton final : linkedin.com, Sunnyvale, 17 000+ personnes, société Microsoft depuis 2016.

## Reproduire le rendu

```bash
npm install
npm run build
```

Chrome doit être disponible (`CHROME_PATH`, sinon `/usr/local/bin/google-chrome`).
Les images passent par `/tmp/li-frames`, le son est généré par `audio.py` (partition originale, aucun morceau tiers).
