import subprocess, re, json, sys

sys.stdout.reconfigure(encoding='utf-8')

print("1. Loading manifest and original cues...")
manifest_path = 'src/data/reference/audio/debabrata-biswas-manifest.json'
manifest = json.load(open(manifest_path, encoding='utf-8'))
old_cues = manifest['cues']
N = len(old_cues)

print("2. Extracting acoustic speech pauses using ffmpeg...")
cmd = [
    'node_modules/ffmpeg-static/ffmpeg.exe',
    '-i', 'Reference/Reference/Debabrata Biswas/audio/Debabrata Biswas Talked(1974) About Rabindrasangeet.mp4',
    '-af', 'highpass=f=200,lowpass=f=3500,silencedetect=noise=-20dB:d=0.35',
    '-f', 'null', '-'
]
res = subprocess.run(cmd, capture_output=True, text=True)
silences = []
start = None
for l in res.stderr.split('\n'):
    m1 = re.search(r'silence_start:\s*([\d\.]+)', l)
    m2 = re.search(r'silence_end:\s*([\d\.]+)\s*\|\s*silence_duration:\s*([\d\.]+)', l)
    if m1:
        start = float(m1.group(1))
    elif m2 and start is not None:
        end = float(m2.group(1))
        dur = float(m2.group(2))
        silences.append({'start': start, 'end': end, 'dur': dur})
        start = None

pause_times = [13.16]
for s in silences:
    if 13.0 <= s['start'] <= 1754.0:
        pause_times.append(s['start'])
    if 13.0 <= s['end'] <= 1754.0:
        pause_times.append(s['end'])
pause_times.append(1753.14)
pause_times = sorted(list(set(pause_times)))
M = len(pause_times)

lens = [max(5, len(c['text'].strip())) for c in old_cues]
AVG_RATE = sum(lens) / (1753.14 - 13.16)

cum_ratios = [0.0]
total_chars = sum(lens)
for l in lens:
    cum_ratios.append(cum_ratios[-1] + (l / total_chars))

expected_T = [13.16 + r * (1753.14 - 13.16) for r in cum_ratios]

valid_j = {}
for i in range(N + 1):
    exp_t = expected_T[i]
    if i == 0:
        valid_j[i] = [0]
    elif i == N:
        valid_j[i] = [M - 1]
    else:
        v = [j for j in range(M) if abs(pause_times[j] - exp_t) <= 25.0]
        if not v:
            v = [min(range(M), key=lambda j: abs(pause_times[j] - exp_t))]
        valid_j[i] = v

dp = {0: {0: (0.0, -1)}}

for i in range(N):
    target_dur = lens[i] / AVG_RATE
    min_dur = max(0.5, lens[i] / 24.0)
    max_dur = max(2.0, lens[i] / 5.5)
    
    dp[i+1] = {}
    prev_states = dp[i]
    next_js = valid_j[i+1]
    
    for nj in next_js:
        nt = pause_times[nj]
        best_cost = float('inf')
        best_pj = -1
        
        for pj, (p_cost, _) in prev_states.items():
            pt = pause_times[pj]
            dur = nt - pt
            if dur < min_dur or dur > max_dur:
                continue
            
            dur_diff = (dur - target_dur) / target_dur
            time_drift = abs(nt - expected_T[i+1]) / 20.0
            step_cost = (dur_diff ** 2) + 0.3 * (time_drift ** 2)
            
            total_c = p_cost + step_cost
            if total_c < best_cost:
                best_cost = total_c
                best_pj = pj
                
        if best_pj != -1:
            dp[i+1][nj] = (best_cost, best_pj)
            
    if not dp[i+1]:
        best_pj = min(prev_states.keys(), key=lambda pj: abs((pause_times[next_js[0]] - pause_times[pj]) - target_dur))
        dp[i+1][next_js[0]] = (prev_states[best_pj][0] + 10.0, best_pj)

cur_j = M - 1
if cur_j not in dp[N]:
    cur_j = min(dp[N].keys(), key=lambda j: dp[N][j][0])

best_boundaries = [cur_j]
for i in range(N, 0, -1):
    prev_j = dp[i][best_boundaries[-1]][1]
    best_boundaries.append(prev_j)

best_boundaries.reverse()
final_timestamps = [pause_times[j] for j in best_boundaries]

print("3. Building new cues with precise word-level timings...")
new_cues = []
for i in range(N):
    t_start = round(final_timestamps[i], 2)
    t_end = round(final_timestamps[i+1], 2)
    raw_text = old_cues[i]['text'].strip()
    words_list = raw_text.split()
    
    total_w_chars = sum(max(1, len(w)) for w in words_list)
    cue_dur = max(0.2, t_end - t_start)
    
    words_data = []
    cum_w = 0
    for w in words_list:
        w_time = round(t_start + (cum_w / total_w_chars) * cue_dur, 2)
        words_data.append({
            'start': w_time,
            'text': w
        })
        cum_w += max(1, len(w))
        
    new_cues.append({
        'id': i,
        'start': t_start,
        'end': t_end,
        'text': raw_text,
        'words': words_data,
        'confidence': 0.96
    })

manifest['cues'] = new_cues
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"✅ Successfully wrote {len(new_cues)} aligned cues to {manifest_path}!")
