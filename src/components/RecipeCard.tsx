import type { Recipe, Ingredient } from '../types';
import { seasonFit, SEASON_FIT_LABEL } from '../lib/season';
import { totalTimesCooked, daysSinceCooked } from '../lib/history';
import type { MealHistory } from '../types';

const STYLE_LABEL: Record<string, string> = {
  quick: 'Snel',
  normal: 'Normaal',
  weekend: 'Weekend',
  weekendProject: 'Weekendproject',
};

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}u ${rem}m` : `${h}u`;
}

interface Props {
  recipe: Recipe;
  allIngredients: Ingredient[];
  history: MealHistory[];
  month: number;
  isDisliked?: boolean;
  onClick?: () => void;
  onFavorite?: () => void;
  showHistory?: boolean;
}

export function RecipeCard({ recipe, allIngredients, history, month, isDisliked, onClick, onFavorite, showHistory }: Props) {
  const fit = seasonFit(recipe.ingredients, allIngredients, month);
  const cooked = showHistory ? totalTimesCooked(recipe.id, history) : null;
  const days = showHistory ? daysSinceCooked(recipe.id, history) : null;

  return (
    <div className={`recipe-card ${recipe.cookingStyle}`} onClick={onClick}>
      <div className="flex gap-sm" style={{ alignItems: 'flex-start' }}>
        <h3 style={{ flex: 1 }}>{recipe.name}</h3>
        {onFavorite && (
          <button
            className="fav-btn"
            title={recipe.favorite ? 'Verwijder favoriet' : 'Markeer als favoriet'}
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          >
            {recipe.favorite ? '★' : '☆'}
          </button>
        )}
      </div>
      {recipe.description && <p>{recipe.description}</p>}
      <div className="recipe-times">
        <span><b>{formatMinutes(recipe.activePrepMinutes)}</b> actief</span>
        {recipe.totalTimeMinutes !== recipe.activePrepMinutes && (
          <span><b>{formatMinutes(recipe.totalTimeMinutes)}</b> totaal</span>
        )}
      </div>
      <div className="tags">
        <span className={`tag style-${recipe.cookingStyle}`}>{STYLE_LABEL[recipe.cookingStyle]}</span>
        <span className={`season-badge ${fit}`}>{SEASON_FIT_LABEL[fit]}</span>
        {recipe.tags.slice(0, 3).map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
        {isDisliked && <span className="tag" style={{ background: '#fee2e2', color: '#991b1b' }}>vermijd</span>}
      </div>
      {showHistory && (cooked !== null && cooked > 0) && (
        <div className="text-muted">
          {cooked}× gekookt
          {days !== null && ` · ${days === 0 ? 'vandaag' : `${days}d geleden`}`}
        </div>
      )}
    </div>
  );
}
