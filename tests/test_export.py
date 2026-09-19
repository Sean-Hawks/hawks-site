import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('check_export', Path(__file__).resolve().parents[1] / 'scripts/check-export.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'sitemap.xml').write_text('<urlset><url><loc>https://hawks.tw/</loc></url></urlset>')
        (self.root / 'rss.xml').write_text('<rss><channel><link>https://hawks.tw/</link></channel></rss>')

    def check(self, html):
        (self.root / 'index.html').write_text(html)
        return checker.check_export(self.root)[0]

    def test_valid_local_and_external_links(self):
        self.assertEqual(self.check('<main id="main"><a href="#main">本文</a><a href="https://example.com/missing">外站</a></main>'), [])

    def test_missing_relative_page_and_fragment(self):
        errors = self.check('<a href="missing/">bad</a><a href="#missing">bad anchor</a>')
        self.assertEqual(len(errors), 2)

    def test_srcset_and_duplicate_ids(self):
        errors = self.check('<div id="repeat"></div><div id="repeat"></div><img srcset="/small.webp 240w, /large.webp 960w">')
        self.assertEqual(len(errors), 3)

    def test_xml_must_parse(self):
        (self.root / 'rss.xml').write_text('<rss>')
        self.assertIn('rss.xml:', self.check('<main></main>')[0])

    def test_encoded_path_cannot_escape_export(self):
        errors = self.check('<img src="/%2e%2e/outside.png">')
        self.assertTrue(any('escapes export' in error for error in errors))


if __name__ == '__main__':
    unittest.main()
