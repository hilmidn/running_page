import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';

const LocationSummary = () => {
  const { years, countries, provinces, cities } = useActivities();
  return (
    <div className="cursor-pointer">
      <section>
        {years ? (
          <Stat
            value={`${years.length}`}
            description={years.length === 1 ? ' year' : ' years'}
          />
        ) : null}
        {countries ? (
          <Stat
            value={countries.length}
            description={countries.length === 1 ? ' country' : ' countries'}
          />
        ) : null}
        {provinces ? (
          <Stat
            value={provinces.length}
            description={
              provinces.length === 1 ? ' province' : ' provinces'
            }
          />
        ) : null}
        {cities ? (
          <Stat
            value={Object.keys(cities).length}
            description={
              Object.keys(cities).length === 1 ? ' city' : ' cities'
            }
          />
        ) : null}
      </section>
      <hr />
    </div>
  );
};

export default LocationSummary;
