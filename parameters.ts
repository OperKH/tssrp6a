import * as CryptoJS from "crypto-js";
import { BigInteger } from "jsbn";

import { hash } from "./utils";

export type PrimeNumber = BigInteger | string;

// tslint:disable:variable-name
export class SRPParameters {
  public static N: {
    "256": BigInteger;
    "512": BigInteger;
    "768": BigInteger;
    "1024": BigInteger;
    "1536": BigInteger;
    "2048": BigInteger;
  };

  public static g: BigInteger;

  public static H: {
    SHA1: string;
    SHA224: string;
    SHA256: string;
    SHA384: string;
    SHA512: string;
    SHA3: string;
    RIPEMD160: string;
  };

  private _N: BigInteger;
  private _NBits: number;
  private _g: BigInteger;
  private _HString: string;
  private _H: CryptoJS.Hasher;
  private _HBits: number;

  constructor(
    N: PrimeNumber = SRPParameters.N[2048],
    g: PrimeNumber = SRPParameters.g,
    H: string = SRPParameters.H.SHA512,
  ) {
    this._N = this._ensureBigInteger(N);
    this._NBits = this._N.bitLength();
    this._g = this._ensureBigInteger(g);

    const hasher = CryptoJS.algo[H];

    if (!hasher || !(hasher instanceof (CryptoJS.lib as any).Hasher.init)) {
      throw new Error("Unknown hash function");
    }

    this._HString = H;
    this._H = hasher.create();
    // Calculate size of hash output
    const hashNumBytes = hash(this, "a").length / 2;
    this._HBits = hashNumBytes * 8;
  }

  get N(): BigInteger {
    return this._N;
  }

  get NBits(): number {
    return this._NBits;
  }

  get g(): BigInteger {
    return this._g;
  }

  get H(): any {
    return this._H;
  }

  get HString(): string {
    return this._HString;
  }

  get HBits(): number {
    return this._HBits;
  }

  private _ensureBigInteger(n: PrimeNumber): BigInteger {
    return typeof n === "string" ? new BigInteger(n) : n;
  }
}

// tslint:disable
SRPParameters.N = {
  "256": new BigInteger(
    "125617018995153554710546479714086468244499594888726646874671447258204721048803",
  ),
  "512": new BigInteger(
    "11144252439149533417835749556168991736939157778924947037200268358613863350040339017097790259154750906072491181606044774215413467851989724116331597513345603",
  ),
  "768": new BigInteger(
    "1087179135105457859072065649059069760280540086975817629066444682366896187793570736574549981488868217843627094867924800342887096064844227836735667168319981288765377499806385489913341488724152562880918438701129530606139552645689583147",
  ),
  "1024": new BigInteger(
    "167609434410335061345139523764350090260135525329813904557420930309800865859473551531551523800013916573891864789934747039010546328480848979516637673776605610374669426214776197828492691384519453218253702788022233205683635831626913357154941914129985489522629902540768368409482248290641036967659389658897350067939",
  ),
  "1536": new BigInteger(
    "1486998185923128292816507353619409521152457662596380074614818966810244974827752411420380336514078832314731499938313197533147998565301020797040787428051479639316928015998415709101293902971072960487527411068082311763171549170528008620813391411445907584912865222076100726050255271567749213905330659264908657221124284665444825474741087704974475795505492821585749417639344967192301749033325359286273431675492866492416941152646940908101472416714421046022696100064262587",
  ),
  "2048": new BigInteger(
    "21766174458617435773191008891802753781907668374255538511144643224689886235383840957210909013086056401571399717235807266581649606472148410291413364152197364477180887395655483738115072677402235101762521901569820740293149529620419333266262073471054548368736039519702486226506248861060256971802984953561121442680157668000761429988222457090413873973970171927093992114751765168063614761119615476233422096442783117971236371647333871414335895773474667308967050807005509320424799678417036867928316761272274230314067548291133582479583061439577559347101961771406173684378522703483495337037655006751328447510550299250924469288819",
  ),
};
// tslint:enable

SRPParameters.g = new BigInteger("2");
SRPParameters.H = {
  SHA1: "SHA1",
  SHA224: "SHA224",
  SHA256: "SHA256",
  SHA384: "SHA384",
  SHA512: "SHA512",
  SHA3: "SHA3",
  RIPEMD160: "RIPEMD160",
};
