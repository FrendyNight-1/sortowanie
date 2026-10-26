from pathlib import Path
import json

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "dokumentacja.pdf"
DATA = ROOT / "docs" / "benchmark-results.json"
FONT_REG = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
pdfmetrics.registerFont(TTFont("Arial", str(FONT_REG)))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(FONT_BOLD)))

INK = colors.HexColor("#183641")
TEAL = colors.HexColor("#087e70")
MUTED = colors.HexColor("#58717b")
PALE = colors.HexColor("#edf5f3")
LINE = colors.HexColor("#d5e3e2")
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="BodyPL", fontName="Arial", fontSize=9.2, leading=13.2, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="BodySmallPL", fontName="Arial", fontSize=8.2, leading=11.2, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="TitlePL", fontName="Arial-Bold", fontSize=24, leading=28, textColor=INK, spaceAfter=12))
styles.add(ParagraphStyle(name="H2PL", fontName="Arial-Bold", fontSize=15, leading=18, textColor=TEAL, spaceBefore=7, spaceAfter=8))
styles.add(ParagraphStyle(name="H3PL", fontName="Arial-Bold", fontSize=10.5, leading=13, textColor=INK, spaceBefore=5, spaceAfter=4))
styles.add(ParagraphStyle(name="KickerPL", fontName="Arial-Bold", fontSize=7.4, leading=9, textColor=TEAL, spaceAfter=7, tracking=1.1))
styles.add(ParagraphStyle(name="CoverMetaPL", fontName="Arial", fontSize=11, leading=17, textColor=MUTED, spaceAfter=6))
styles.add(ParagraphStyle(name="TablePL", fontName="Arial", fontSize=7.0, leading=8.7, textColor=INK))
styles.add(ParagraphStyle(name="TableHeadPL", fontName="Arial-Bold", fontSize=7.2, leading=8.7, textColor=WHITE))
styles.add(ParagraphStyle(name="SmallCenterPL", fontName="Arial", fontSize=8.1, leading=10, textColor=MUTED, alignment=TA_CENTER))

def P(text, style="BodyPL"):
    return Paragraph(text, styles[style])

def bullet(text):
    return P("• " + text, "BodySmallPL")

def page_decor(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(INK)
    canvas.rect(0, h - 13 * mm, w, 13 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#cce5df"))
    canvas.setFont("Arial-Bold", 7.5)
    canvas.drawString(18 * mm, h - 8.4 * mm, "ASD1-M1-01  |  LABORATORIUM SORTOWANIA")
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 15 * mm, w - 18 * mm, 15 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Arial", 7.5)
    canvas.drawString(18 * mm, 9.5 * mm, "Dokumentacja projektu · 2026/2027")
    canvas.drawRightString(w - 18 * mm, 9.5 * mm, "Strona " + str(doc.page))
    canvas.restoreState()

def chapter(kicker, title, elements):
    result = [P(kicker.upper(), "KickerPL"), P(title, "H2PL")]
    result.extend(elements)
    return result

def make_benchmark_table(rows):
    alg = {"selection": "Selection", "insertion": "Insertion", "merge": "Merge", "quick": "Quick Lomuto"}
    data = [[P(x, "TableHeadPL") for x in ["n", "Dane", "Algorytm", "Porównania", "Zapisy"]]]
    for row in rows:
        data.append([P(str(row["size"]), "TablePL"), P(row["pattern"], "TablePL"),
                     P(alg[row["algorithm"]], "TablePL"), P(str(row["comparisons"]), "TablePL"),
                     P(str(row["writes"]), "TablePL")])
    table = Table(data, colWidths=[12 * mm, 28 * mm, 39 * mm, 27 * mm, 20 * mm], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
        ("GRID", (0, 0), (-1, -1), 0.25, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
    ]))
    return table

def main():
    rows = json.loads(DATA.read_text(encoding="utf-8"))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=20*mm, bottomMargin=20*mm,
                            title="ASD1-M1-01 - Laboratorium sortowania", author="Daniel Nedwecki")
    story = []

    # 1
    story += [Spacer(1, 18*mm), P("ASD1-M1-01 · MINI-PROJEKT M1", "KickerPL"),
              P("Laboratorium<br/>sortowania", "TitlePL"),
              P("Interaktywna aplikacja edukacyjna do obserwowania czterech algorytmów na tych samych danych.", "CoverMetaPL"),
              Spacer(1, 9*mm)]
    cover = Table([
        [P("<b>Autor</b>", "BodyPL"), P("Daniel Nedwecki", "BodyPL")],
        [P("<b>Numer indeksu</b>", "BodyPL"), P("93797", "BodyPL")],
        [P("<b>Przedmiot</b>", "BodyPL"), P("Algorytmy i struktury danych I", "BodyPL")],
        [P("<b>Rok akademicki</b>", "BodyPL"), P("2026/2027", "BodyPL")],
        [P("<b>Data</b>", "BodyPL"), P("26.10.2026", "BodyPL")],
    ], colWidths=[42*mm, 105*mm])
    cover.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),PALE),("BOX",(0,0),(-1,-1),0.5,LINE),("INNERGRID",(0,0),(-1,-1),0.25,LINE),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),9),("TOPPADDING",(0,0),(-1,-1),8)]))
    story += [cover, Spacer(1, 14*mm), P("Dokument zawiera opis zakresu, implementacji, testów, porównania operacji, ograniczeń i źródeł. Dane autora i numer indeksu podano na stronie tytułowej.", "BodyPL"), PageBreak()]

    # 2
    story += chapter("02 · Cel i zakres", "Problem, odbiorca i wymagania", [
        P("Celem projektu jest pokazanie, jak cztery metody sortowania przekształcają tę samą tablicę. Odbiorca może śledzić nie tylko wynik, lecz także porównania, przesunięcia, zamiany, podział rekurencyjny i scalanie."),
        P("Aplikacja przyjmuje od 0 do 40 liczb całkowitych z zakresu -99…99. Dane mogą zawierać wartości ujemne i duplikaty. Każde wystąpienie ma osobne ID i etykietę, na przykład 5A oraz 5B. Metoda sortuje własną kopię wejścia."),
        P("Wykonane metody", "H3PL"),
        bullet("<b>Selection Sort:</b> wybór minimum z nieuporządkowanego sufiksu; zamiana następuje tylko dla różnych pozycji."),
        bullet("<b>Insertion Sort:</b> przesuwanie większych kluczy i wstawienie elementu w wolne miejsce."),
        bullet("<b>Merge Sort:</b> rekurencyjny podział oraz scalanie; przy równych kluczach pierwszeństwo ma lewa połowa."),
        bullet("<b>Quick Sort Lomuto:</b> ostatni element aktywnego fragmentu jest pivotem; widoczna jest granica podziału."),
        P("Zakres aplikacji obejmuje edycję tablicy, pięć gotowych scenariuszy, sterowanie krokiem, odtwarzanie, pauzę, reset i tempo. Widok ujawnia indeksy, aktywny fragment, zmienne algorytmu, pseudokod i przyczynę działania.")
    ]) + [PageBreak()]

    # 3
    story += chapter("03 · Metody iteracyjne", "Selection Sort i Insertion Sort", [
        P("Selection Sort przechodzi od lewej do prawej. Dla indeksu i znajduje najmniejszą wartość w zakresie i…n-1, a potem umieszcza ją na pozycji i. W tej implementacji pomija zamianę, gdy minimum już znajduje się na właściwej pozycji."),
        P("<b>Operacje Selection:</b> każde sprawdzenie A[j] &lt; A[min] zwiększa licznik porównań. Zamiana dwóch różnych pozycji dodaje dwa zapisy. Algorytm wykonuje dokładnie n(n-1)/2 porównań dla n ≥ 1; liczba zapisów zależy od danych."),
        P("Insertion Sort utrzymuje uporządkowany prefiks. Bieżący element staje się kluczem. Większe elementy są przesuwane w prawo; klucz trafia w pierwsze wolne miejsce. Porównanie klucza z elementem prefiksu jest liczone, gdy element istnieje."),
        P("<b>Stabilność:</b> warunek przesunięcia jest ścisły (wartość &gt; key), dlatego elementy o równych kluczach nie mijają się. Jeśli klucz już zajmuje właściwą pozycję, implementacja nie zapisuje go ponownie."),
        P("Koszt zależy od wejścia. Dla tablicy rosnącej Insertion wykonuje n-1 porównań i zero zapisów tablicy. Dla wejścia malejącego wykonuje n(n-1)/2 porównań, przesunięcia oraz zapisy kluczy.")
    ]) + [PageBreak()]

    # 4
    story += chapter("04 · Metody rekurencyjne", "Merge Sort i Quick Sort Lomuto", [
        P("Merge Sort dzieli przedział na dwie połowy aż do fragmentów jednoelementowych. Następnie scala uporządkowane połowy do bufora pomocniczego i kopiuje wynik do tablicy. Porównanie z warunkiem <= wybiera lewy element przy równości, co zachowuje stabilność."),
        P("Licznik Merge Sort obejmuje zapisy do bufora oraz kopie z bufora do tablicy. Podczas scalania każdy element danego fragmentu zapisuje się raz do bufora i raz z powrotem. Łączna liczba zapisów zależy od rozmiaru i kształtu podziału; mieści się w O(n log n). Pamięć pomocnicza ma rząd O(n)."),
        P("Quick Sort Lomuto wybiera A[prawy] jako pivot. Zmienna granica wskazuje koniec części wartości <= pivot. Po jednym przejściu pivot umieszczany jest na pozycji między częściami, po czym oba fragmenty są sortowane rekurencyjnie."),
        P("Każde porównanie A[j] <= pivot zwiększa licznik porównań. Zamiany różnych pozycji liczą dwa zapisy; gdy granica jest równa j, zbędna zamiana jest pominięta. Zły dobór pivota, na przykład ostatniego elementu w tablicy rosnącej, daje koszt kwadratowy."),
        P("Stabilność testuje się po ID, nie po samych wartościach. Selection i Quick Lomuto nie gwarantują zachowania pierwotnej kolejności równych kluczy.")
    ]) + [PageBreak()]

    # 5
    story += chapter("05 · Struktury i interfejs", "Od wejścia do rzeczywistej klatki", [
        P("Model elementu zawiera wartość, niezmienne ID i etykietę widoczną w interfejsie. Funkcja przygotowania danych waliduje rozmiar, typ i zakres, a następnie tworzy kopie dla sortowania."),
        P("Moduł algorytmów wykonuje operacje i zapisuje klatki historii w chwili ich wykonania. Klatka przechowuje kopię tablicy, liczniki, linię pseudokodu, aktywny zakres, znaczniki minimum/klucza/pivota, granicę i bufor. Interfejs odtwarza tę historię; nie ma ręcznie nagranej animacji."),
        P("Sterowanie", "H3PL"),
        bullet("Krok przesuwa pokaz o jedną klatkę."),
        bullet("Start/Pauza odtwarza lub zatrzymuje historię."),
        bullet("Reset wraca do danych wejściowych."),
        bullet("Suwak zmienia odstęp czasowy od 120 do 1400 ms."),
        bullet("Edytowanie danych lub zmiana algorytmu tworzy nowy przebieg."),
        P("Legenda korzysta jednocześnie z koloru, obramowania i podpisu tekstowego. Oznaczenia aktywnego elementu, minimum, klucza i pivota pozostają czytelne bez rozróżniania samych barw.")
    ]) + [PageBreak()]

    # 6
    story += chapter("06 · Testy", "Testy automatyczne i ich wynik", [
        P("Testy uruchomiono poleceniem node --test tests/algorithms.test.js. Wynik z lokalnego wykonania: 14 testów zaliczonych, 0 niezaliczonych. Zestaw obejmuje wszystkie metody sortowania, walidację, parsowanie danych i pomiary."),
        P("Przypadki sprawdzone", "H3PL"),
        bullet("Każda metoda sortuje wartości mieszane, ujemne i powtarzające się; wszystkie ID pozostają obecne."),
        bullet("Pusta i jednoelementowa tablica kończą pracę bez porównań kluczy."),
        bullet("Merge Sort zachowuje kolejność ID równych wartości i etykiety 5A, 5B."),
        bullet("Insertion Sort zachowuje kolejność elementów o równych kluczach."),
        bullet("Klatka po znalezieniu nowego minimum w Selection zawiera właściwy indeks i wartość."),
        bullet("Pierwsza partycja Quick Sort wskazuje ostatni element jako pivot oraz granicę początkową."),
        bullet("Selection na danych rosnących nie wykonuje zbędnych zamian; liczba zapisów wynosi zero."),
        bullet("Merge dla wejścia [2, 1] wykonuje jedno porównanie i cztery zapisy: dwa do bufora i dwa z powrotem."),
        bullet("Walidacja odrzuca 41 elementów, ułamki i wartość spoza zakresu; akceptuje -99 i 99."),
        bullet("Pomiar tworzy 36 wierszy: 3 rozmiary × 3 układy × 4 metody; wszystkie wyniki są sprawdzane jako uporządkowane.")
    ]) + [PageBreak()]

    # 7
    story += chapter("07 · Porównanie", "Liczniki operacji dla 36 przebiegów", [
        P("Zestawy wejściowe są deterministyczne. Rosnące i malejące zawierają kolejne wartości; zestaw z powtórzeniami powtarza cykl -2, -1, 0, 1, 2. Każda z czterech metod otrzymuje identyczne wejście dla danego rozmiaru."),
        P("C = porównania kluczy. Z = zapisy do tablic, również pomocniczych. Zamiana różnych pozycji to dwa zapisy. Rysowanie, klatki historii i walidacja są wyłączone. To liczniki operacji, nie pomiary czasu zegarowego.", "BodySmallPL"),
        make_benchmark_table(rows),
        Spacer(1, 4),
        P("Źródło liczb: scripts/benchmark.js uruchomiony na kodzie projektu; pełne dane znajdują się w docs/benchmark-results.json.", "BodySmallPL")
    ]) + [PageBreak()]

    # 8
    story += chapter("08 · Interpretacja", "Co pokazują liczniki", [
        P("Na wejściu rosnącym o długości 40 Insertion wykonuje 39 porównań i zero zapisów. Selection i Quick Lomuto wykonują po 780 porównań. Quick nie musi w tym układzie zapisywać elementów, lecz wybieranie skrajnego pivota nadal wymusza podział 39+0, 38+0 i kolejnych fragmentów."),
        P("Na wejściu malejącym o długości 40 Insertion wykonuje 780 porównań i 819 zapisów, ponieważ przesuwa elementy oraz zapisuje klucze. Merge wykonuje 100 porównań i 432 zapisy w przyjętym modelu z buforem."),
        P("Na wejściu z powtórzeniami dla n=40 Quick Lomuto wykonuje 248 porównań i 140 zapisów. Wynik pokazuje wpływ rozkładu danych i polityki zamian; nie dowodzi, że ten wariant będzie szybszy dla każdego wejścia."),
        P("Selection wykonuje n(n-1)/2 porównań niezależnie od kolejności danych. W badanych rozmiarach rosnących: 45, 190 i 780. Merge zapisuje elementy do bufora i kopiuje je z powrotem, dlatego zapisów jest więcej, lecz podział jest zrównoważony."),
        P("Wnioski dotyczą wyłącznie zdefiniowanych liczników, konkretnych tablic i implementacji. Nie wyciągamy z nich wniosków o milisekundach ani szybkości na każdym komputerze.")
    ]) + [PageBreak()]

    # 9
    story += chapter("09 · Technologie i uruchomienie", "Lokalna aplikacja bez kont i API", [
        P("Interfejs tworzą HTML i CSS; algorytmy oraz sterowanie krokami napisano w JavaScript ES modules. Testy automatyczne wykorzystują wbudowany moduł node:test. Dane pozostają w przeglądarce; projekt nie wykonuje żądań sieciowych do usług AI."),
        P("Uruchomienie", "H3PL"),
        P("1. Zainstaluj Python 3.<br/>2. W katalogu projektu uruchom: python3 -m http.server 8000<br/>3. Otwórz http://127.0.0.1:8000/ w przeglądarce.<br/>4. Testy uruchom poleceniem: npm test."),
        P("Pliki źródłowe", "H3PL"),
        bullet("index.html oraz assets/styles.css - układ, typografia i oznaczenia."),
        bullet("src/algorithms.js - walidacja, cztery algorytmy, historia klatek i liczniki."),
        bullet("src/app.js - sterowanie, wizualizacja, quiz i tabela porównawcza."),
        bullet("tests/algorithms.test.js - zestaw testów automatycznych."),
        bullet("presentation/index.html - osobna prezentacja 10 slajdów."),
        P("Użycie AI", "H3PL"),
        P("Asystent AI pomógł przygotować kod, testy i treści dokumentacji. Autor powinien przeczytać i zrozumieć implementację, samodzielnie powtórzyć testy, zweryfikować wyniki i przedstawić własny wkład podczas obrony.")
    ]) + [PageBreak()]

    # 10
    story += chapter("10 · Podsumowanie i obrona", "Wynik, ograniczenia i dalsze sprawdzenie", [
        P("Projekt łączy działające implementacje czterech metod z wizualizacją ich stanów. Testy automatyczne sprawdzają poprawność wyników, stabilność tam, gdzie wymagana, kluczowe stany pośrednie i liczniki zapisów. Porównanie obejmuje 36 deterministycznych przebiegów."),
        P("Ograniczenia", "H3PL"),
        bullet("Tablica ma najwyżej 40 liczb całkowitych z zakresu -99…99."),
        bullet("Quick Sort wykorzystuje Lomuto z ostatnim elementem jako pivotem; może mieć koszt O(n²)."),
        bullet("Liczniki nie mierzą czasu zegarowego ani pamięci szczytowej."),
        bullet("Autor samodzielnie opublikuje wymagane repozytorium GitHub."),
        P("Plan pokazu", "H3PL"),
        P("1. Pokaż metodę i pseudokod. 2. Wykonaj jeden przebieg krok po kroku. 3. Zmień dane podczas pokazu. 4. Porównaj liczniki. 5. Pokaż duplikaty lub przypadek pustej tablicy. 6. Odpowiedz na pytanie o bieżący stan. 7. Wyjaśnij wskazany fragment kodu."),
        P("Materiały", "H3PL"),
        P("Princeton Algorithms, Elementary Sorts: algs4.cs.princeton.edu/21elementary/<br/>Princeton Algorithms, Mergesort: algs4.cs.princeton.edu/22mergesort/<br/>Princeton Algorithms, Quicksort: algs4.cs.princeton.edu/23quicksort/"),
        P("Przed oddaniem: uruchom aplikację na komputerze prezentacyjnym, sprawdź odnośniki, przećwicz demonstrację i samodzielnie opublikuj wymagane repozytorium GitHub.", "BodySmallPL")
    ])

    doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
    print(str(OUT))

if __name__ == "__main__":
    main()


