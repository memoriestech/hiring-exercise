import { it, expect } from 'vitest';
import { screen, render } from 'lib/test-utils';
import HomePage from './page';

async function resolvePage(Component: typeof HomePage) {
  const ComponentResolved = await Component();
  return () => ComponentResolved;
}

it('renders homepage', async () => {
  const HomePageResolved = await resolvePage(HomePage);
  render(<HomePageResolved />);
  expect(screen.getByText('hello world')).toBeInTheDocument();
});
