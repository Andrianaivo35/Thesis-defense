# -*- coding: utf-8 -*-
"""
ÉTAPE 3 — GÉNÉRATION DU DOCUMENT WORD

Usage : python scripts/memoire/generer-chapitre3.py

Assemble le chapitre 3 à partir de `ecrans.json` et des figures produites
aux étapes 1 et 2. Produit `chapitre3/Chapitre3.docx`.

CE QUE LE DOCUMENT CONTIENT

  - une numérotation continue des figures : « Figure 3.1 », « Figure 3.2 »…
  - une légende sous chaque image, en italique et centrée
  - un renvoi dans le texte, pour que le paragraphe désigne sa figure
  - la liste numérotée des annotations, reprise des pastilles
  - une table des figures en fin de chapitre

POURQUOI UN SCRIPT PLUTÔT QU'UN DOCUMENT ÉCRIT À LA MAIN

Parce que les figures changent. Chaque modification d'interface impose de
recapturer, et un document écrit à la main devient faux sans prévenir :
une légende qui parle d'un bouton déplacé, une numérotation qui saute.

Ici, texte et images viennent de la même source. Le document se
régénère en une commande.

CE QUI RESTE À FAIRE À LA MAIN

Le document est une BASE de travail, pas un chapitre fini. Les
transitions entre sections, l'argumentation et les renvois aux autres
chapitres se rédigent dans Word. Ce script fait la partie mécanique —
celle qu'on rate quand on la fait vingt fois.
"""
import io
import json
import os
import sys

try:
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Cm, Pt, RGBColor
except ImportError:
    print('python-docx est requis :  pip install python-docx')
    sys.exit(1)

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.abspath(os.path.join(ICI, '..', '..'))
FIGURES = os.path.join(RACINE, 'chapitre3', 'figures')
SORTIE = os.path.join(RACINE, 'chapitre3', 'Chapitre3.docx')

NUMERO_CHAPITRE = 3
LARGEUR_IMAGE_CM = 15.5     # tient dans une page A4 avec marges de 2,5 cm
GRIS = RGBColor(0x60, 0x60, 0x60)


def charger(nom, defaut):
    chemin = os.path.join(FIGURES, nom)
    if not os.path.exists(chemin):
        return defaut
    with io.open(chemin, encoding='utf-8') as f:
        return json.load(f)


def styles(doc):
    """Corps de texte lisible et justifié, comme attendu d'un mémoire."""
    normal = doc.styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(11)
    paragraphe = normal.paragraph_format
    paragraphe.space_after = Pt(8)
    paragraphe.line_spacing = 1.15
    paragraphe.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def legende(doc, numero, titre):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(14)

    etiquette = p.add_run('Figure %d.%d — ' % (NUMERO_CHAPITRE, numero))
    etiquette.bold = True
    etiquette.font.size = Pt(9.5)
    etiquette.font.color.rgb = GRIS

    corps = p.add_run(titre)
    corps.italic = True
    corps.font.size = Pt(9.5)
    corps.font.color.rgb = GRIS


def inserer_image(doc, chemin):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(chemin, width=Cm(LARGEUR_IMAGE_CM))


def main():
    config_path = os.path.join(ICI, 'ecrans.json')
    with io.open(config_path, encoding='utf-8') as f:
        config = json.load(f)

    if not os.path.isdir(FIGURES):
        print('Aucune figure. Lancez dans l\'ordre :')
        print('  node scripts/memoire/capturer-ecrans.mjs')
        print('  python scripts/memoire/annoter-captures.py')
        sys.exit(1)

    legendes = charger('legendes.json', {})

    doc = Document()
    styles(doc)

    doc.add_heading('Chapitre %d — Présentation de l\'application' % NUMERO_CHAPITRE, level=1)

    intro = doc.add_paragraph()
    intro.add_run(
        "Ce chapitre présente la plateforme telle qu'elle se donne à voir. "
        "Il suit les quatre acteurs — l'étudiant, l'entreprise, l'établissement "
        "et l'administration — plutôt que l'arborescence des écrans : c'est le "
        "parcours de chacun qui explique les choix d'interface, non l'inverse. "
        "Les mécanismes qui les traversent tous sont réunis en fin de chapitre."
    )

    figure = 0
    table_des_figures = []
    manquantes = []

    for section in config['sections']:
        doc.add_heading(section['titre'], level=2)
        if section.get('introduction'):
            doc.add_paragraph(section['introduction'])

        for ecran in section['ecrans']:
            nom = ecran['fichier']
            annote = os.path.join(FIGURES, nom + '-annote.png')
            brute = os.path.join(FIGURES, nom + '.png')
            image = annote if os.path.exists(annote) else brute

            if not os.path.exists(image):
                manquantes.append(nom)
                continue

            figure += 1
            doc.add_heading(ecran['titre'], level=3)

            # Le paragraphe désigne sa figure : un renvoi explicite évite
            # au lecteur de chercher de quelle image on parle.
            p = doc.add_paragraph()
            p.add_run(ecran.get('texte', ''))
            renvoi = p.add_run(' (figure %d.%d)' % (NUMERO_CHAPITRE, figure))
            renvoi.bold = True

            inserer_image(doc, image)
            legende(doc, figure, ecran['titre'])

            # Les pastilles de l'image, reprises en toutes lettres.
            for entree in legendes.get(nom, []):
                item = doc.add_paragraph(style='List Number')
                item.paragraph_format.space_after = Pt(2)
                item.add_run(entree['texte'])

            table_des_figures.append((figure, ecran['titre']))

    doc.add_page_break()
    doc.add_heading('Table des figures', level=2)
    for numero, titre in table_des_figures:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        etiquette = p.add_run('Figure %d.%d — ' % (NUMERO_CHAPITRE, numero))
        etiquette.bold = True
        p.add_run(titre)

    os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
    doc.save(SORTIE)

    print('%d figure(s) dans %s' % (figure, os.path.relpath(SORTIE, RACINE)))
    if manquantes:
        print('Images absentes, écrans ignorés : %s' % ', '.join(manquantes))
        print('  (relancez capturer-ecrans.mjs)')


if __name__ == '__main__':
    main()
