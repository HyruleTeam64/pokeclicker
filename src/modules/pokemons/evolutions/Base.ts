import { Observable as KnockoutObservable } from 'knockout';
import { StoneType } from '../../GameConstants';
import CustomRequirement from '../../requirements/CustomRequirement';
import LazyRequirementWrapper from '../../requirements/LazyRequirementWrapper';
import MaxRegionRequirement from '../../requirements/MaxRegionRequirement';
import ObtainedPokemonRequirement from '../../requirements/ObtainedPokemonRequirement';
import PokemonLevelRequirement from '../../requirements/PokemonLevelRequirement';
import Requirement from '../../requirements/Requirement';
import { calcNativeRegion } from '../PokemonHelper';
import { PokemonNameType } from '../PokemonNameType';

export enum EvoTrigger {
    LEVEL,
    STONE,
}

export interface EvoData {
    basePokemon: PokemonNameType;
    evolvedPokemon: PokemonNameType;
    trigger: EvoTrigger;
    restrictions: Array<Requirement>;
}

export interface LevelEvoData extends EvoData {
    triggered: KnockoutObservable<boolean>;
}

export interface StoneEvoData extends EvoData {
    stone: StoneType;
}

export const beforeEvolve: Partial<Record<EvoTrigger, (data: EvoData) => boolean>> = {
    [EvoTrigger.LEVEL]: (data: LevelEvoData) => {
        data.triggered(true);
        return true;
    },
};

export const Evo = (basePokemon: PokemonNameType, evolvedPokemon: PokemonNameType, trigger: EvoTrigger): EvoData => ({
    basePokemon,
    evolvedPokemon,
    trigger,
    restrictions: [
        new ObtainedPokemonRequirement(basePokemon),
        new LazyRequirementWrapper(
            // wrapping because pokemonMap is needed to calcNativeRegion,
            // but we use Evos while making pokemonMap...
            // wrapping here delays execution until later, after pokemon is available
            () => new MaxRegionRequirement(calcNativeRegion(evolvedPokemon)),
        ),
    ],
});

export const restrict = <T extends EvoData>(evo: T, ...restrictions: EvoData['restrictions']): T => {
    evo.restrictions.push(...restrictions);
    return evo;
};

export const LevelEvolution = (basePokemon: PokemonNameType, evolvedPokemon: PokemonNameType, level: number): LevelEvoData => {
    const triggered = ko.observable(false);
    return restrict(
        { ...Evo(basePokemon, evolvedPokemon, EvoTrigger.LEVEL), triggered },
        new CustomRequirement(triggered, false, 'The evolution can\'t have already happened'),
        new PokemonLevelRequirement(basePokemon, level),
        new ObtainedPokemonRequirement(evolvedPokemon, true),
    );
};

export const StoneEvolution = (basePokemon: PokemonNameType, evolvedPokemon: PokemonNameType, stone: StoneType): StoneEvoData => ({
    ...Evo(basePokemon, evolvedPokemon, EvoTrigger.STONE),
    stone,
});
