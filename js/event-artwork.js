// Reviewed event artwork, shared by all scene variants and existing client sites.
const registryURL=new URL('./event-artwork.json?v=20261007-1',import.meta.url);
const key=value=>String(value||'').trim().replace(/\s+/g,' ').toLowerCase();
export async function resolveEventArtwork(sample){
 const response=await fetch(registryURL,{cache:'no-store'});
 if(!response.ok)throw Error('Reviewed event artwork unavailable');
 const registry=await response.json();
 const slugIds={"rang-mahal":"sceneRangMahal","neel-sarovar":"sceneNeelSarovar","gulabi-darbaar":"sceneGulabiDarbaar","van-sarovar":"sceneVanSarovar","noor-e-mohabbat":"sceneNoorMohabbat","phulkari-courtyard":"scenePhulkariCourtyard","padma-prangan":"scenePadmaPrangan","rosewood-vows":"sceneRosewoodVows","sunehra-aangan":"sceneSunehraAangan","chandrika-utsav":"sceneChandrikaUtsav","noor-e-sarovar":"sceneNoorSarovar","azure-lake-chapel":"sceneAzureLakeChapel","kaveri-thendral":"sceneKaveriThendral"};
 const entries=registry[sample.sceneDesignId||slugIds[sample.slug]];
 if(!entries)throw Error('Unknown illustrated design');
 const lookup=new Map(Object.entries(entries).map(([name,artwork])=>[key(name),artwork]));
 sample.events=(sample.events||[]).map((entry,index)=>{
  const e=Array.isArray(entry)?[...entry]:[entry.name,entry.date,entry.time,entry.venue,entry.note,entry.effect,entry.hint,entry.mapLink];
  if(sample.signatureVersion===1 && !Array.isArray(entry)){e[8]=entry.scenePlate;return e;}
  const artwork=lookup.get(key(e[0]));
  if(artwork){e[5]=artwork.effect;e[6]=artwork.hint;e[8]=artwork.plate;}
  else{console.warn('Unsupported legacy event artwork:',e[0]);e[5]='lotus';e[6]='Tap the lotus to send your wishes';e[8]=index+2;}
  return e;
 });
}
