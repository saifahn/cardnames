import { Team } from './types'

export function getOpposingTeam(team: Team): Team {
  return team === 'mirran' ? 'phyrexian' : 'mirran'
}
