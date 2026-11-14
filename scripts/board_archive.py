#!/usr/bin/env python3
"""Pack/unpack declarative TheBoard v1 archives using only Python's standard library."""
import argparse
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED

LIMIT = 180 * 1024 * 1024

def validate(document, paths):
    assert document.get('version') == 1, 'Unsupported version'
    assert isinstance(document.get('title'), str), 'title must be a string'
    nodes, edges = document['nodes'], document['edges']
    assert len(nodes) <= 500 and len(edges) <= 2000, 'Board size limit exceeded'
    ids, screens, edge_ids = set(), set(), set()
    for node in nodes:
        assert isinstance(node['id'], str) and node['id'] and node['id'] not in ids, 'Duplicate/empty node ID'
        ids.add(node['id'])
        assert node['type'] in ('screen', 'note'), 'Unknown node type'
        for coordinate in ('x', 'y'):
            value = document.get('layout', {}).get('nodes', {}).get(node['id'], node.get('position', {}))[coordinate]
            assert isinstance(value, (float, int)) and abs(value) < float('inf'), 'Invalid coordinate'
        assert isinstance(node['data']['title'], str), 'Missing title'
        if node['type'] == 'screen':
            screens.add(node['id'])
            image = node['data']['image']
            assert image.startswith('assets/') and '..' not in image and image in paths, 'Missing/unsafe asset'
            assert PurePosixPath(image).suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'), 'Unsupported image'
        else:
            assert isinstance(node['data'].get('text', ''), str), 'Invalid note'
    for edge in edges:
        assert edge['id'] and edge['id'] not in edge_ids, 'Duplicate/empty edge ID'
        edge_ids.add(edge['id'])
        assert edge['source'] in screens and edge['target'] in screens and edge['source'] != edge['target'], 'Invalid edge endpoint'
        assert isinstance(edge.get('label', ''), str), 'Invalid edge label'
        for field in ('sourceHandle', 'targetHandle'):
            assert edge.get(field) in (None, 'left', 'right', 'top', 'bottom'), 'Invalid connection face'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['pack', 'unpack'])
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    assert not args.destination.exists(), 'Destination already exists; choose a new path'
    if args.action == 'pack':
        files = {p.relative_to(args.source).as_posix(): p for p in args.source.rglob('*') if p.is_file()}
        assert all(not p.is_symlink() and p.resolve().is_relative_to(args.source.resolve()) for p in files.values()), 'Unsafe symlink'
        assert sum(p.stat().st_size for p in files.values()) <= LIMIT, 'Archive size limit exceeded'
        validate(json.loads(files['board.json'].read_text()), files)
        with ZipFile(args.destination, 'x', ZIP_DEFLATED) as archive:
            for name, path in files.items():
                archive.write(path, name)
    else:
        with ZipFile(args.source) as archive:
            entries = archive.infolist()
            assert sum(i.file_size for i in entries) <= LIMIT, 'Archive size limit exceeded'
            names = [i.filename for i in entries]
            assert len(names) == len(set(names)), 'Duplicate entries'
            assert all(not PurePosixPath(n).is_absolute() and '..' not in PurePosixPath(n).parts and '\\' not in n for n in names), 'Unsafe path'
            validate(json.loads(archive.read('board.json')), names)
            args.destination.mkdir(parents=True)
            archive.extractall(args.destination)
    print(args.destination.resolve())

if __name__ == '__main__':
    main()
