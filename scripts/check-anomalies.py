import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/reference/audio/debabrata-biswas-manifest.json', encoding='utf-8') as f:
    d = json.load(f)

cues = d['cues']
anomalies = []
for i, c in enumerate(cues):
    dur = c['end'] - c['start']
    if dur <= 0:
        anomalies.append(f"Zero/negative duration at [{i}]: start={c['start']}, end={c['end']}, dur={dur}")
    if i > 0 and c['start'] < cues[i-1]['start']:
        anomalies.append(f"Non-monotonic backward jump at [{i}]: prev_start={cues[i-1]['start']}, curr_start={c['start']}")
    if i > 0 and c['start'] < cues[i-1]['end']:
        overlap = round(cues[i-1]['end'] - c['start'], 2)
        if overlap > 0.5:
            anomalies.append(f"Large overlap at [{i}]: prev_end={cues[i-1]['end']}, curr_start={c['start']} (overlap {overlap}s)")

print(f"Total cues: {len(cues)}, Total anomalies: {len(anomalies)}")
for a in anomalies[:25]:
    print(a)
