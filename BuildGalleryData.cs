using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;

class BuildGalleryData
{
    class PhotoInfo
    {
        public int Id;
        public string Filename;
        public string Title;
        public string Date;
        public string Time;
        public string Category;
        public string CategoryName;
        public string Location;
        public string Description;
        public double Lat;
        public double Lng;
        public string MapsUrl;
    }

    static void Main()
    {
        string dir = @"C:\Users\D.O.M\Desktop\grecja2026-www";
        string[] files = Directory.GetFiles(dir, "IMG_*.jpg");
        Array.Sort(files);

        List<PhotoInfo> list = new List<PhotoInfo>();
        int id = 1;

        foreach (string fullPath in files)
        {
            string fname = Path.GetFileName(fullPath);
            // Format: IMG_YYYYMMDD_HHMMSS...
            Match m = Regex.Match(fname, @"IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})");
            if (!m.Success) continue;

            string year = m.Groups[1].Value;
            string month = m.Groups[2].Value;
            string day = m.Groups[3].Value;
            string hour = m.Groups[4].Value;
            string minute = m.Groups[5].Value;

            int iDay = int.Parse(day);
            int iHour = int.Parse(hour);

            string dateStr = "";
            switch (month)
            {
                case "09": dateStr = iDay + " września " + year; break;
                case "10": dateStr = iDay + " października " + year; break;
                default: dateStr = iDay + "." + month + "." + year; break;
            }
            string timeStr = hour + ":" + minute;

            string category = "riviera";
            string categoryName = "Riwiera Olimpijska & Morze Egejskie";
            string location = "Riwiera Olimpijska (Paralia Katerinis / Morze Egejskie)";
            string title = "";
            string desc = "";
            double lat = 40.2671;
            double lng = 22.5975;

            // Route & Chronological Classification
            if (month == "09" && iDay == 26)
            {
                category = "riviera";
                categoryName = "Riwiera Olimpijska & Morze Egejskie";
                location = "Riwiera Olimpijska (Paralia Katerinis)";
                title = "Powitanie z Riwierą Olimpijską";
                desc = "Pierwsze chwile po przybyciu na greckie wybrzeże u stóp mitycznego masywu Olimpu. Ciepła bryza Morza Egejskiego i szum fal.";
                lat = 40.2671; lng = 22.5975;
            }
            else if (month == "09" && iDay == 27)
            {
                category = "riviera";
                categoryName = "Riwiera Olimpijska & Morze Egejskie";
                location = "Riwiera Olimpijska (Wybrzeże Morza Egejskiego)";
                title = "Święte Wybrzeże Morza Egejskiego";
                desc = "Złocisty piasek Riwiery Olimpijskiej oblewany krystalicznymi falami Zatoki Termajskiej. W tle wznosi się monumentalny masyw góry bogów.";
                lat = 40.2671; lng = 22.5975;
            }
            else if (month == "09" && iDay == 28)
            {
                if (iHour < 10)
                {
                    category = "riviera";
                    categoryName = "Riwiera Olimpijska & Morze Egejskie";
                    location = "Riwiera Olimpijska o świcie";
                    title = "Poranny blask nad Zatoką Termajską";
                    desc = "Promienie heliosa muskające taflę Morza Egejskiego przed wyruszeniem do starożytnego sanktuarium Zeusa.";
                    lat = 40.2671; lng = 22.5975;
                }
                else if (iHour >= 10 && iHour < 14)
                {
                    category = "dion";
                    categoryName = "Święte Miasto Dion & Sanktuarium Zeusa";
                    location = "Park Archeologiczny Dion – Święte Miasto Zeusa";
                    lat = 40.1755; lng = 22.4878;

                    if (iHour == 10)
                    {
                        title = "Brama do Świętego Miasta Dion";
                        desc = "Wkroczenie na teren starożytnego Dionu – macedońskiego centrum religijnego, gdzie król Filip II i Aleksander Wielki składali ofiary przed wyprawami.";
                    }
                    else if (iHour == 11)
                    {
                        title = "Antyczne Świątynie i Aleje Dionu";
                        desc = "Pozostałości monumentalnych sanktuariów Zeusa Najwyższego (Zeus Hypsistos), Izydy i Demeter, otoczone bujną roślinnością i źródlaną wodą Olimpu.";
                    }
                    else if (iHour == 12)
                    {
                        title = "Willa Dionizosa i Bezcenne Mozaiki";
                        desc = "Słynne mozaiki podłogowe przedstawiające triumf Dionizosa oraz kunsztowne termy rzymskie z zachowanym systemem hypokaustum.";
                    }
                    else
                    {
                        title = "Teatr Antyczny i Rzeka Baphyras";
                        desc = "Scena greckiego teatru u stóp Olimpu oraz święta rzeka Baphyras, w której według mitu nimfy obmyły ręce po ukaraniu Orfeusza.";
                    }
                }
                else
                {
                    // Afternoon Sep 28: Enipeas Gorge & Litochoro
                    category = "olympus";
                    categoryName = "Masyw Olimpu & Wąwóz Enipeas";
                    location = "Wąwóz Enipeas – Podnóże Tronu Zeusa (Litochoro)";
                    lat = 40.1783; lng = 22.4831;

                    if (iHour < 16)
                    {
                        title = "Szlak przez Wąwóz Enipeas";
                        desc = "Dziki, skalisty kanion Enipeas z rwącymi potokami i wiszącymi drewnianymi kładkami, wiodący w głąb królestwa Zeusa.";
                    }
                    else
                    {
                        title = "Mityczne Wanny Afrodyty i Źródła Olimpu";
                        desc = "Krystalicznie czyste kaskady wodne i naturalne baseny skalne, w których według podań kąpała się bogini Afrodyta.";
                    }
                }
            }
            else if (month == "09" && iDay == 29)
            {
                category = "olympus";
                categoryName = "Masyw Olimpu & Wąwóz Enipeas";
                if (iHour < 14)
                {
                    location = "Klasztor św. Dionizego na Olimpie";
                    lat = 40.1189; lng = 22.4289;
                    title = "Monastyr św. Dionizego na Olimpie";
                    desc = "Zabytkowy XVI-wieczny monastyr ukryty w gęstych lasach masywu Olimpu. Ostoja prawosławnej duchowości pod mitycznym szczytem Mitikas.";
                }
                else
                {
                    location = "Punkty Widokowe Masywu Olimpu (Prionia / Stavros)";
                    lat = 40.0883; lng = 22.3586;
                    title = "Panorama Mitycznego Tronu Zeusa";
                    desc = "Spektakularne spojrzenie na groźne granie i urwiska Olimpu, gdzie według Homera zbierali się nieśmiertelni bogowie.";
                }
            }
            else if (month == "09" && iDay == 30)
            {
                category = "riviera";
                categoryName = "Riwiera Olimpijska & Morze Egejskie";
                location = "Riwiera Olimpijska (Paralia Katerinis)";
                title = "Lazurowe Fale Morza Egejskiego";
                desc = "Spokój i harmonia greckiej riwiery. Krystaliczna woda odbijająca błękit bezchmurnego nieba nad Helladą.";
                lat = 40.2671; lng = 22.5975;
            }
            else if (month == "10" && iDay == 1)
            {
                category = "meteora";
                categoryName = "Meteory – Wiszące Monastyry";
                location = "Meteory (Kalambaka – Skalne Klasztory)";
                lat = 39.7217; lng = 21.6306;

                if (iHour < 10)
                {
                    title = "Poranek w Krainie Meteorów";
                    desc = "Pionowe skalne filary wyrastające z mgieł równiny tesalskiej niczym gigantyczne rzeźby tytanów.";
                }
                else if (iHour < 12)
                {
                    title = "Klasztor Wielki Meteoron i Varlaam";
                    desc = "Majestat monastyrów zawieszonych między niebem a ziemią na szczytach niedostępnych iglic z piaskowca.";
                }
                else
                {
                    title = "Monastyr Roussanou i Skalne Przepaście";
                    desc = "Widok zapierający dech w piersiach na labirynt skalnych baszt i zabytkowe eremy pustelników.";
                }
            }
            else if (month == "10" && (iDay == 2 || iDay == 3))
            {
                category = "riviera";
                categoryName = "Riwiera Olimpijska & Morze Egejskie";
                location = "Riwiera Olimpijska – Złote Wybrzeże";
                title = "Pożegnanie z Riwierą Olimpijską";
                desc = "Ostatnie spojrzenia na szmaragdowe wody Morza Egejskiego, pamiątki i wspomnienia z wyprawy szlakami bogów i bohaterów.";
                lat = 40.2671; lng = 22.5975;
            }

            string mapsUrl = string.Format(
                System.Globalization.CultureInfo.InvariantCulture,
                "https://www.google.com/maps/search/?api=1&query={0:F4},{1:F4}",
                lat, lng);

            PhotoInfo p = new PhotoInfo();
            p.Id = id++;
            p.Filename = fname;
            p.Title = title;
            p.Date = dateStr;
            p.Time = timeStr;
            p.Category = category;
            p.CategoryName = categoryName;
            p.Location = location;
            p.Description = desc;
            p.Lat = lat;
            p.Lng = lng;
            p.MapsUrl = mapsUrl;

            list.Add(p);
        }

        StringBuilder sb = new StringBuilder();
        sb.AppendLine("// Grecja Olimpijska 2026 - Baza Fotografii Wyprawy");
        sb.AppendLine("// Generated with UTF-8 encoding");
        sb.AppendLine("const GALLERY_PHOTOS = [");

        for (int i = 0; i < list.Count; i++)
        {
            PhotoInfo p = list[i];
            sb.AppendLine("  {");
            sb.AppendFormat("    id: {0},\n", p.Id);
            sb.AppendFormat("    filename: \"{0}\",\n", p.Filename);
            sb.AppendFormat("    title: \"{0}\",\n", EscapeJson(p.Title));
            sb.AppendFormat("    date: \"{0}\",\n", EscapeJson(p.Date));
            sb.AppendFormat("    time: \"{0}\",\n", EscapeJson(p.Time));
            sb.AppendFormat("    category: \"{0}\",\n", p.Category);
            sb.AppendFormat("    categoryName: \"{0}\",\n", EscapeJson(p.CategoryName));
            sb.AppendFormat("    location: \"{0}\",\n", EscapeJson(p.Location));
            sb.AppendFormat("    description: \"{0}\",\n", EscapeJson(p.Description));
            sb.AppendFormat(System.Globalization.CultureInfo.InvariantCulture, "    lat: {0:F4},\n", p.Lat);
            sb.AppendFormat(System.Globalization.CultureInfo.InvariantCulture, "    lng: {0:F4},\n", p.Lng);
            sb.AppendFormat("    mapsUrl: \"{0}\"\n", p.MapsUrl);
            sb.Append("  }");
            if (i < list.Count - 1) sb.Append(",");
            sb.AppendLine();
        }

        sb.AppendLine("];");

        string outPath = Path.Combine(dir, "gallery-data.js");
        File.WriteAllText(outPath, sb.ToString(), new UTF8Encoding(true));
        Console.WriteLine("Successfully generated {0} with {1} photos.", outPath, list.Count);
    }

    static string EscapeJson(string s)
    {
        if (s == null) return "";
        return s.Replace("\"", "\\\"");
    }
}
