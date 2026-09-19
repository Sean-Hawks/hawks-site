#!/usr/bin/env python3
"""Validate local links and assets in a Next.js static export, without network I/O."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import sys
import xml.etree.ElementTree as ET

ORIGIN = 'https://hawks.tw'

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.refs, self.ids = [], []
        self.redirect = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'refresh':
            self.redirect = True
        for name in ('src', 'href'):
            if attrs.get(name):
                self.refs.append(attrs[name])
        if attrs.get('srcset') and not attrs['srcset'].startswith('data:'):
            self.refs.extend(part.strip().split()[0] for part in attrs['srcset'].split(',') if part.strip())


def check_export(root):
    root = Path(root).resolve()
    if not (root / 'index.html').is_file():
        return ['Missing out/index.html; build the website first.'], 0
    pages = {p: Page(p.read_text()) for p in root.rglob('*.html')}
    errors = set()

    def check_ref(ref, source, base):
        parsed = urlsplit(urljoin(ORIGIN + base, ref))
        if parsed.scheme not in ('http', 'https') or parsed.netloc != 'hawks.tw':
            return
        target = (root / unquote(parsed.path).lstrip('/')).resolve()
        if not target.is_relative_to(root):
            errors.add(f'{source}: path escapes export: {ref}')
            return
        if target.is_dir():
            target /= 'index.html'
        if not target.is_file():
            errors.add(f'{source}: missing target: {ref}')
            return
        if parsed.fragment and target in pages:
            # Next's built-in error/redirect documents have no page main element.
            if parsed.fragment == 'main-content' and (pages[target].redirect or target.name == '404.html' or target.parent.name == '404' or '_not-found' in target.parts):
                return
            if unquote(parsed.fragment) not in pages[target].ids:
                errors.add(f'{source}: missing anchor: {ref}')

    for file, page in pages.items():
        relative = file.relative_to(root).as_posix()
        base = '/' + relative.removesuffix('index.html')
        for ident, count in Counter(page.ids).items():
            if count > 1:
                errors.add(f'{relative}: duplicate id: {ident}')
        for ref in page.refs:
            if not page.redirect:
                check_ref(ref, relative, base)

    for name in ('sitemap.xml', 'rss.xml'):
        path = root / name
        try:
            document = ET.parse(path)
        except (ET.ParseError, OSError) as error:
            errors.add(f'{name}: {error}')
            continue
        for element in document.iter():
            if element.tag.rsplit('}', 1)[-1] in ('loc', 'link') and element.text:
                check_ref(element.text.strip(), name, '/')
    return sorted(errors), len(pages)


if __name__ == '__main__':
    errors, count = check_export(sys.argv[1] if len(sys.argv) > 1 else 'out')
    for error in errors:
        print(error)
    print(f'Checked {count} HTML files, sitemap and RSS: {len(errors)} issues.')
    sys.exit(bool(errors))
