#!/usr/bin/env python3
import argparse
import json
import sys
from typing import List, Tuple

import cv2
import numpy as np


def find_differences_and_draw_boxes(
    image_path_a: str,
    image_path_b: str,
    min_area: int = 300,
    combine_into_single_box: bool = False,
) -> List[Tuple[int, int, int, int]]:
    """
    Returns list of bounding boxes as (x, y, w, h).
    
    - min_area filters tiny noise regions
    - combine_into_single_box encloses all changes in one box
    """
    image_a = cv2.imread(image_path_a)
    image_b = cv2.imread(image_path_b)

    if image_a is None or image_b is None:
        raise ValueError("Failed to read one or both images. Check the paths.")

    if image_a.shape[:2] != image_b.shape[:2]:
        image_b = cv2.resize(image_b, (image_a.shape[1], image_a.shape[0]))

    diff = cv2.absdiff(image_a, image_b)
    gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    kernel = np.ones((3, 3), np.uint8)
    opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes: List[Tuple[int, int, int, int]] = []
    for contour in contours:
        if cv2.contourArea(contour) < min_area:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        boxes.append((x, y, w, h))

    if combine_into_single_box and boxes:
        x_min = min(x for x, y, w, h in boxes)
        y_min = min(y for x, y, w, h in boxes)
        x_max = max(x + w for x, y, w, h in boxes)
        y_max = max(y + h for x, y, w, h in boxes)
        boxes = [(x_min, y_min, x_max - x_min, y_max - y_min)]

    return boxes


def main():
    parser = argparse.ArgumentParser(
        description="Find differences between two images and return bounding boxes."
    )
    parser.add_argument("image_a", type=str, help="Path to first image (previous)")
    parser.add_argument("image_b", type=str, help="Path to second image (current)")
    parser.add_argument("--min-area", type=int, default=300, help="Ignore regions smaller than this area")
    parser.add_argument(
        "--single-box",
        action="store_true",
        help="Draw one box that encloses all differences",
    )
    args = parser.parse_args()

    try:
        boxes = find_differences_and_draw_boxes(
            args.image_a,
            args.image_b,
            min_area=args.min_area,
            combine_into_single_box=args.single_box,
        )
        
        # Output in a format that the Node.js service can parse
        print(f"Found {len(boxes)} change region(s): {boxes}")
        
        # Also output as JSON for easier parsing
        result = {
            "segments": [
                {
                    "id": i + 1,
                    "bbox": {"x": x, "y": y, "width": w, "height": h}
                }
                for i, (x, y, w, h) in enumerate(boxes)
            ]
        }
        print(f"JSON_OUTPUT:{json.dumps(result)}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()