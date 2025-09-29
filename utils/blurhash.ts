const blurhashArray = [
  "LGK8-m?^=|x]=}1Ka1r?I9:*aJNG",
  "LIIo;wwg2nXmQ6j@x[Sv2pS1}kxH",
  "T87or48w?9yXHrawHq%jD,D4x=kF",
  "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
  "LKO2?V%2Tw=w]~RBVZRi};RPxuwH",
  "LGFFaXYk^6#M@-5c,1J5@[or[Q6.",
  "LFALRl4pL4=x_Mt7t7oL9F%MIV9F",
  "L9AS7sx^00t7nNAiRjj[00%MRjj["
]

export const getRandomBlurhash = () => 
  blurhashArray[Math.floor(Math.random() * blurhashArray.length)];
