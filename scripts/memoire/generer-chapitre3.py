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
DOSSIER_SORTIE = os.path.join(RACINE, 'chapitre3')

# Deux documents, pour deux usages.
#
#   Essentiel  ce qui porte le memoire : le moteur de recommandation, la
#              lecture des CV, l'import de promotion, les mecanismes de
#              securite. C'est le chapitre qu'on defend.
#
#   Complet    les 44 ecrans, y compris ceux dont on peut se passer. Il
#              sert de reserve : on y prend une figure au besoin, et le
#              niveau de chaque ecran y est indique pour savoir ce qui se
#              retire sans dommage.
DOCUMENTS = [
    {
        'fichier': 'Chapitre3-Essentiel.docx',
        'niveaux': ('coeur',),
        'sous_titre': "Les ecrans qui portent la contribution",
        'annonce': [
            "Ce chapitre présente la plateforme par ce qu'elle apporte : le moteur de "
            "recommandation et son explication, la lecture automatique des CV, la gestion "
            "par promotion, et les mécanismes de sécurité qui les rendent utilisables.",

            "Les écrans secondaires — modification de profil, changement de mot de passe, "
            "connexion des différents rôles — sont réunis dans la version complète du "
            "chapitre, où ils sont signalés comme tels.",
        ],
    },
    {
        'fichier': 'Chapitre3-Complet.docx',
        'niveaux': ('coeur', 'utile', 'accessoire'),
        'sous_titre': "Tous les ecrans de l'application",
        'annonce': [
            "Ce chapitre présente les quarante-quatre écrans de la plateforme. Il suit les "
            "quatre acteurs — l'étudiant, l'entreprise, l'établissement et l'administration — "
            "plutôt que l'arborescence des fichiers : c'est le parcours de chacun qui "
            "explique les choix d'interface, non l'inverse. Les mécanismes qui les traversent "
            "tous sont réunis en fin de chapitre.",

            "Les figures signalées « secondaire » peuvent être retirées sans nuire à la "
            "démonstration : elles documentent des écrans de service.",
        ],
    },
]

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

LIBELLES_NIVEAU = {
    'coeur': None,                 # rien à signaler : c'est la norme
    'utile': 'complément',
    'accessoire': 'secondaire',
}


def composer(config, legendes, definition):
    """Compose un document, en ne retenant que les niveaux demandés."""
    doc = Document()
    styles(doc)

    doc.add_heading("Chapitre %d — Présentation de l'application" % NUMERO_CHAPITRE, level=1)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(definition['sous_titre'])
    r.italic = True
    r.font.color.rgb = GRIS

    for bloc in definition['annonce']:
        doc.add_paragraph(bloc)

    figure = 0
    table_des_figures = []
    manquantes = []

    for section in config['sections']:
        retenus = [e for e in section['ecrans']
                   if e.get('importance', 'utile') in definition['niveaux']]
        if not retenus:
            continue

        doc.add_heading(section['titre'], level=2)
        if section.get('introduction'):
            doc.add_paragraph(section['introduction'])

        for ecran in retenus:
            nom = ecran['fichier']
            annote = os.path.join(FIGURES, nom + '-annote.png')
            brute = os.path.join(FIGURES, nom + '.png')
            image = annote if os.path.exists(annote) else brute

            if not os.path.exists(image):
                manquantes.append(nom)
                continue

            figure += 1
            # Le titre vient du bloc « titres », regroupé en tête du fichier
            # de configuration pour se modifier d'un seul endroit.
            titre = config.get('titres', {}).get(nom) or ecran.get('titre') or nom

            entete = doc.add_heading(titre, level=3)
            mention = LIBELLES_NIVEAU.get(ecran.get('importance'))
            if mention:
                # Signalé dans le document complet, pour qu'on sache d'un
                # coup d'oeil ce qui peut être retiré.
                marque = entete.add_run('   (%s)' % mention)
                marque.italic = True
                marque.font.size = Pt(10)
                marque.font.color.rgb = GRIS

            # Le paragraphe désigne sa figure : un renvoi explicite évite au
            # lecteur de chercher de quelle image on parle.
            para = doc.add_paragraph()
            para.add_run(ecran.get('texte', ''))
            renvoi = para.add_run(' (figure %d.%d)' % (NUMERO_CHAPITRE, figure))
            renvoi.bold = True

            inserer_image(doc, image)
            legende(doc, figure, titre)

            # Les pastilles de l'image, reprises en toutes lettres et dans
            # le même ordre : la puce 1 correspond à la pastille 1.
            for entree in legendes.get(nom, []):
                item = doc.add_paragraph(style='List Number')
                item.paragraph_format.space_after = Pt(2)
                item.add_run(entree['texte'])

            table_des_figures.append((figure, titre))

    doc.add_page_break()
    doc.add_heading('Table des figures', level=2)
    for numero, titre in table_des_figures:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        etiquette = p.add_run('Figure %d.%d — ' % (NUMERO_CHAPITRE, numero))
        etiquette.bold = True
        p.add_run(titre)

    cible = os.path.join(DOSSIER_SORTIE, definition['fichier'])
    os.makedirs(DOSSIER_SORTIE, exist_ok=True)
    doc.save(cible)

    return figure, manquantes


def main():
    with io.open(os.path.join(ICI, 'ecrans.json'), encoding='utf-8') as f:
        config = json.load(f)

    if not os.path.isdir(FIGURES):
        print("Aucune figure. Lancez dans l'ordre :")
        print('  node scripts/memoire/capturer-ecrans.mjs')
        print('  python scripts/memoire/annoter-captures.py')
        sys.exit(1)

    legendes = charger('legendes.json', {})
    manquantes = set()

    for definition in DOCUMENTS:
        figures, absentes = composer(config, legendes, definition)
        manquantes.update(absentes)
        print('%-28s %2d figure(s)' % (definition['fichier'], figures))

    if manquantes:
        print('\nImages absentes, écrans ignorés : %s' % ', '.join(sorted(manquantes)))
        print('  (relancez capturer-ecrans.mjs)')


if __name__ == '__main__':
    main()
