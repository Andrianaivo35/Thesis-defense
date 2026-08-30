# -*- coding: utf-8 -*-
"""
ÉTAPE 2 — ANNOTATION DES CAPTURES

Usage : python scripts/memoire/annoter-captures.py

Lit les images de `chapitre3/figures/` et le relevé `reperes.json` produit
par l'étape 1, puis dépose sur chaque zone un cadre et une pastille
numérotée.

POURQUOI LES COORDONNÉES VIENNENT DU NAVIGATEUR

Placer une flèche « à l'œil » sur une capture oblige à tout refaire dès
que l'interface bouge d'un pixel — et personne ne s'aperçoit qu'une
annotation désigne désormais le mauvais élément.

Ici, l'étape 1 a relevé la position réelle de chaque élément dans le
navigateur. Les annotations suivent l'interface au lieu de la supposer.

CE QUI EST PRODUIT

  <nom>-annote.png   l'image annotée
  legendes.json      le texte de chaque pastille, pour le document

Les images d'origine ne sont pas modifiées : on peut réannoter sans
recapturer.
"""
import io
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.abspath(os.path.join(ICI, '..', '..'))
FIGURES = os.path.join(RACINE, 'chapitre3', 'figures')

# Les captures sont prises au double de la résolution (deviceScaleFactor),
# mais les coordonnées relevées sont en pixels CSS : il faut les mettre à
# l'échelle, sinon les pastilles se retrouvent dans le quart supérieur
# gauche de l'image.
ECHELLE = 2

# Rouge soutenu : lisible sur les fonds clairs de l'application comme sur
# une impression en noir et blanc, où il devient un gris franc.
COULEUR = (211, 47, 47)
BLANC = (255, 255, 255)

RAYON = 22 * ECHELLE          # pastille
EPAISSEUR = 3 * ECHELLE       # cadre


def police(taille):
    """Une police lisible, quelle que soit la machine."""
    for chemin in (
        r'C:\Windows\Fonts\arialbd.ttf',
        r'C:\Windows\Fonts\arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
    ):
        if os.path.exists(chemin):
            try:
                return ImageFont.truetype(chemin, taille)
            except OSError:
                continue
    return ImageFont.load_default()


def poser_pastille(dessin, x, y, numero, fonte):
    """Un disque plein numéroté, avec un liseré blanc pour rester lisible
    quel que soit ce qu'il recouvre."""
    boite = (x - RAYON, y - RAYON, x + RAYON, y + RAYON)
    dessin.ellipse(boite, fill=COULEUR, outline=BLANC, width=EPAISSEUR)

    texte = str(numero)
    gauche, haut, droite, bas = dessin.textbbox((0, 0), texte, font=fonte)
    dessin.text(
        (x - (droite - gauche) / 2, y - (bas - haut) / 2 - haut * 0.15),
        texte, fill=BLANC, font=fonte,
    )


def annoter(nom, reperes):
    source = os.path.join(FIGURES, nom + '.png')
    if not os.path.exists(source):
        print('  image absente :', nom)
        return None

    image = Image.open(source).convert('RGB')
    dessin = ImageDraw.Draw(image)
    fonte = police(int(26 * ECHELLE))
    legendes = []

    for numero, repere in enumerate(reperes, start=1):
        x = repere['x'] * ECHELLE
        y = repere['y'] * ECHELLE
        largeur = repere['width'] * ECHELLE
        hauteur = repere['height'] * ECHELLE

        # Cadre autour de la zone désignée
        dessin.rectangle(
            (x - EPAISSEUR, y - EPAISSEUR, x + largeur + EPAISSEUR, y + hauteur + EPAISSEUR),
            outline=COULEUR, width=EPAISSEUR,
        )

        # La pastille se pose À CÔTÉ du cadre, jamais dessus : posée sur
        # le coin, elle masquait le début du texte qu'elle désigne — le
        # lecteur voyait « es promotions » au lieu de « Mes promotions ».
        #
        # À gauche de préférence, au-dessus si le bord gauche est trop
        # proche, et ramenée dans l'image dans tous les cas : une
        # pastille à moitié coupée ne se lit pas davantage.
        marge = RAYON + EPAISSEUR * 2
        if x - marge - RAYON >= 4:
            px, py = x - marge, y + hauteur / 2
        elif y - marge - RAYON >= 4:
            px, py = x + RAYON, y - marge
        else:
            px, py = x + largeur + marge, y + hauteur / 2

        px = min(max(px, RAYON + 4), image.width - RAYON - 4)
        py = min(max(py, RAYON + 4), image.height - RAYON - 4)
        poser_pastille(dessin, px, py, numero, fonte)

        legendes.append({'numero': numero, 'texte': repere.get('legende', '')})

    cible = os.path.join(FIGURES, nom + '-annote.png')
    image.save(cible, 'PNG')
    return legendes


def main():
    releve = os.path.join(FIGURES, 'reperes.json')
    if not os.path.exists(releve):
        print("Aucun relevé de repères. Lancez d'abord :")
        print('  node scripts/memoire/capturer-ecrans.mjs')
        sys.exit(1)

    with io.open(releve, encoding='utf-8') as f:
        reperes_par_ecran = json.load(f)

    toutes = {}
    annotees = 0

    for nom, reperes in reperes_par_ecran.items():
        if not reperes:
            # Sans repère, l'image d'origine sert telle quelle : inutile
            # d'en produire une copie identique.
            continue
        legendes = annoter(nom, reperes)
        if legendes is not None:
            toutes[nom] = legendes
            annotees += 1
            print('  %-28s %d pastille(s)' % (nom, len(legendes)))

    with io.open(os.path.join(FIGURES, 'legendes.json'), 'w', encoding='utf-8') as f:
        json.dump(toutes, f, ensure_ascii=False, indent=2)

    print('\n%d image(s) annotée(s).' % annotees)
    print('Étape suivante : python scripts/memoire/generer-chapitre3.py')


if __name__ == '__main__':
    main()
