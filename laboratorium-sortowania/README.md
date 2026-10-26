# Laboratorium sortowania

Projekt edukacyjny do zadania ASD1-M1-01. Aplikacja pokazuje krok po kroku działanie czterech algorytmów sortowania i porównuje liczbę wykonywanych operacji.

## Autor

- Imię i nazwisko: Daniel Nedwecki
- Numer indeksu: 93797
- Przedmiot / zadanie: ASD1-M1-01 — Algorytmy i struktury danych I
- Rok akademicki: 2026/2027

## Uruchomienie

Aplikacja działa lokalnie w przeglądarce. Do zwykłego używania nie wymaga Pythona, Node.js, serwera ani połączenia z internetem.

1. Otwórz folder projektu.
2. Kliknij dwukrotnie `index.html`.
3. Jeśli Windows zapyta o program, wybierz Edge, Chrome lub Firefox.

Po ponownym uruchomieniu komputera wystarczy ponownie otworzyć `index.html`. Aplikacja nie wysyła wpisanych danych do internetu.

## Funkcje aplikacji

- Wpisywanie od 0 do 40 liczb całkowitych z zakresu −99…99.
- Gotowe zestawy: losowy, rosnący, malejący, prawie uporządkowany i z powtórzeniami.
- Pokaz algorytmu krok po kroku lub automatycznie z regulacją tempa.
- Pseudokod oraz oznaczenia aktywnych elementów, minimum, klucza, pivota i bufora scalania.
- Liczniki porównań kluczy i zapisów do tablic.
- Porównanie algorytmów dla rozmiarów 10, 20 i 40 oraz danych rosnących, malejących i z powtórzeniami.
- Quizy o stabilności i partycjonowaniu Lomuto.

## Algorytmy

- **Selection Sort** — wybiera minimum z nieuporządkowanej części i przenosi je na początek.
- **Insertion Sort** — wstawia kolejny element w odpowiednie miejsce uporządkowanej części.
- **Merge Sort** — dzieli tablicę na fragmenty, a następnie scala je w uporządkowaną całość.
- **Quick Sort Lomuto** — dzieli fragment względem ostatniego elementu, który jest pivotem.

Szczegółowe objaśnienia, przykłady, złożoności i plan prezentacji znajdują się w `sortowania_do_nauki.txt`.

## Liczniki

Aplikacja zlicza porównania kluczy oraz zapisy do tablic. Zamiana dwóch elementów oznacza dwa zapisy. Merge Sort uwzględnia zapisy do bufora pomocniczego i kopiowanie wyników z powrotem. Liczniki nie mierzą czasu zegarowego i nie uwzględniają animacji ani walidacji danych.

## Struktura projektu

- `index.html` — strona aplikacji.
- `assets/styles.css` — wygląd strony.
- `src/app.js` — obsługa interfejsu i animacji.
- `src/algorithms.js` — implementacje algorytmów i generowanie kroków.
- `src/standalone.js` — skrypt umożliwiający otwarcie aplikacji bez serwera.
- `tests/` — testy algorytmów.
- `scripts/` — skrypty pomocnicze.
- `presentation/` — prezentacja.
- `docs/` — dokumentacja.

## Testy i rozwój

Testy wymagają Node.js. W terminalu otwartym w katalogu projektu uruchom:

    npm test

Testy nie są potrzebne do zwykłego otwierania aplikacji. Po zmianie kodu źródłowego w `src/app.js` lub `src/algorithms.js` należy ponownie wygenerować `src/standalone.js` za pomocą skryptu projektu.

## Ograniczenia

- Quick Sort Lomuto używa ostatniego elementu fragmentu jako pivota; niekorzystne podziały mogą prowadzić do O(n²).
- Merge Sort wymaga dodatkowego bufora O(n).
- Insertion Sort i Merge Sort są stabilne w tej implementacji; Selection Sort i Quick Sort Lomuto nie są stabilne.
- Aplikacja przyjmuje najwyżej 40 liczb całkowitych od −99 do 99.

## Użycie narzędzi AI

Projekt przygotowano z pomocą asystenta AI. Autor powinien zapoznać się z kodem, rozumieć działanie algorytmów, samodzielnie wykonać pokaz i zweryfikować wyniki przed prezentacją.
