import { BigInteger } from "jsbn";

import { SRPConfig } from "./config";
import { SRPSession } from "./session";
import {
  bigIntegerToHex,
  evenLengthHex,
  HexString,
  hexToBigInteger,
  utf8ToHex,
} from "./utils";

export enum SRPClientSessionState {
  INIT = "INIT",
  STEP_1 = "STEP_1",
  STEP_2 = "STEP_2",
  STEP_3 = "STEP_3",
}

export interface ISRPClientCredentials {
  A: HexString;
  M1: HexString;
}

export class SRPClientSession extends SRPSession {
  /**
   * Current client auth state
   */
  private stateStep: SRPClientSessionState;

  /**
   * User identity "I"
   */
  private _I: string;

  /**
   * User password "P"
   */
  private _P: string;

  /**
   * Client public value "A"
   */
  private _A: BigInteger;

  /**
   * Client evidence message "M1"
   */
  private _M1: BigInteger;

  constructor(config: SRPConfig, timeoutMillis?: number) {
    super(config, timeoutMillis);

    this.stateStep = SRPClientSessionState.INIT;
  }

  public step1(userId: string, userPassword: string): void {
    this._expectState(SRPClientSessionState.INIT);

    if (!userId || !userId.trim()) {
      throw new Error("User identity must not be null nor empty");
    }

    this.I = userId;

    if (!userPassword) {
      throw new Error("User password must not be null");
    }

    this.P = userPassword;

    this.stateStep = SRPClientSessionState.STEP_1;
    this._registerActivity();
  }

  public step2(sHex: HexString, BHex: HexString): ISRPClientCredentials {
    this._expectState(SRPClientSessionState.STEP_1);
    this._throwOnTimeout();

    if (!sHex) {
      throw new Error("Salt (s) must not be null");
    }

    const s = hexToBigInteger(evenLengthHex(sHex));

    if (!BHex) {
      throw new Error("Public server value (B) must not be null");
    }

    const B = hexToBigInteger(evenLengthHex(BHex));

    const routines = this.config.routines;

    const x = routines.computeX(this.I, bigIntegerToHex(s), utf8ToHex(this.P));
    // Remove password from memory since we don"t need it anymore
    this._clearP();
    const a = routines.generatePrivateValue();
    this.A = routines.computeClientPublicValue(a);
    const k = routines.computeK();
    const u = routines.computeU(this.A, B);
    this.S = routines.computeClientSessionKey(k, x, u, a, B);
    this.M1 = routines.computeClientEvidence(this.I, s, this.A, B, this.S);

    this.stateStep = SRPClientSessionState.STEP_2;
    this._registerActivity();

    return {
      A: bigIntegerToHex(this.A),
      M1: bigIntegerToHex(this.M1),
    };
  }

  public step3(M2hex: HexString): void {
    this._expectState(SRPClientSessionState.STEP_2);
    this._throwOnTimeout();

    if (!M2hex) {
      throw new Error("Server evidence (M2) must not be null");
    }

    const M2 = hexToBigInteger(evenLengthHex(M2hex));
    const computedM2 = this.config.routines.computeServerEvidence(
      this.A,
      this.M1,
      this.S,
    );

    if (!computedM2.equals(M2)) {
      throw new Error("Bad server credentials");
    }

    this.stateStep = SRPClientSessionState.STEP_3;
    this._registerActivity();
  }

  get state(): SRPClientSessionState {
    return this.stateStep;
  }

  get I(): string {
    if (this._I) {
      return this._I;
    }

    throw new Error("User Identity (I) not set");
  }

  set I(I: string) {
    if (this._I) {
      throw new Error(`User identity (I) already set: ${this._I}`);
    }

    this._I = I;
  }

  get P(): string {
    if (this._P) {
      return this._P;
    }

    throw new Error("User password (P) not set");
  }

  set P(P: string) {
    if (this._P) {
      throw new Error(`User password (P) already set: ${this._P}`);
    }

    this._P = P;
  }

  private _clearP(): void {
    this._P = undefined;
  }

  get A(): BigInteger {
    if (this._A) {
      return this._A;
    }

    throw new Error("Public client value (A) not set");
  }

  set A(A: BigInteger) {
    if (this._A) {
      throw new Error(
        `Public client value (A) already set: ${bigIntegerToHex(this._A)}`,
      );
    }

    if (!this.config.routines.isValidPublicValue(A)) {
      throw new Error(`Bad client public value (A): ${bigIntegerToHex(A)}`);
    }

    this._A = A;
  }

  get M1(): BigInteger {
    if (this._M1) {
      return this._M1;
    }

    throw new Error("Client evidence (M1) not set");
  }

  set M1(M1: BigInteger) {
    if (this._M1) {
      throw new Error(
        `Client evidence (M1) already set: ${bigIntegerToHex(this._M1)}`,
      );
    }

    this._M1 = M1;
  }

  private _expectState(state: SRPClientSessionState): void {
    if (this.state !== state) {
      throw new Error(
        `State violation: Session must be in ${state} state but is in ${
          this.state
        }`,
      );
    }
  }
}
