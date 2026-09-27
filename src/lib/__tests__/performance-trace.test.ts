import { traceServerOperation } from '../performance-trace';

describe('opt-in performance trace', () => {
  const original=process.env.PERFORMANCE_TRACE;
  afterEach(()=>{if(original===undefined)delete process.env.PERFORMANCE_TRACE;else process.env.PERFORMANCE_TRACE=original;jest.restoreAllMocks();});

  it('does not log while disabled and preserves the returned object',async()=>{
    delete process.env.PERFORMANCE_TRACE;
    const log=jest.spyOn(console,'info').mockImplementation(()=>{});
    const value={ok:true};
    expect(await traceServerOperation('reference.data',m=>m('cards',async()=>value))).toBe(value);
    expect(log).not.toHaveBeenCalled();
  });

  it('records parallel stages together without logging results',async()=>{
    process.env.PERFORMANCE_TRACE='1';
    const log=jest.spyOn(console,'info').mockImplementation(()=>{});
    await traceServerOperation('reference.data',m=>Promise.all([m('cards',async()=>({secret:'not-for-logs'})),m('stats',async()=>3)]));
    expect(log).toHaveBeenCalledTimes(1);
    const event=JSON.parse(log.mock.calls[0][1]);
    expect(event).toMatchObject({operation:'reference.data',status:'ok',durationMs:expect.any(Number)});
    expect(event.stages.map((s:{stage:string})=>s.stage).sort()).toEqual(['cards','stats']);
    expect(JSON.stringify(event)).not.toContain('not-for-logs');
  });

  it('rethrows the same failure while recording no error details',async()=>{
    process.env.PERFORMANCE_TRACE='1';
    const log=jest.spyOn(console,'info').mockImplementation(()=>{});
    const error=new Error('private connection details');
    await expect(traceServerOperation('reference.data',m=>m('cards',async()=>{throw error;}))).rejects.toBe(error);
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(log.mock.calls[0][1])).toMatchObject({status:'error',stages:[expect.objectContaining({stage:'cards',status:'error'})]});
    expect(JSON.stringify(log.mock.calls)).not.toContain(error.message);
  });
});
