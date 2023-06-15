import { Col, Container, Row } from 'react-bootstrap';
import safeJsonStringify from 'safe-json-stringify';
import PropTypes from 'prop-types';
import { NextSeo } from 'next-seo';
import { withSession } from '@/lib/iron-session';
import prisma from '@/lib/db';
import RiiTag from '@/components/user/RiiTag';
import UserInformationCard from '@/components/user/UserInformationCard';
import ShowYourTagCard from '@/components/user/ShowYourTagCard';
import ENV from '@/lib/constants/environmentVariables';
import GeneralUserAdminCard from '@/components/user/admin/GeneralUserAdminCard';

export const getServerSideProps = withSession(async ({ req, query }) => {
  const { username } = query;
  const loggedInUsername = req.session?.username;
  const loggedInUser = await prisma.user.findFirst({
    where: {
      username: loggedInUsername,
    },
    select: {
      role: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      username: username.toString(),
    },
    select: {
      username: true,
      badge: true,
      name_on_riitag: true,
    },
  });

  if (!user) {
    return { notFound: true };
  }

  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return {
        redirect: {
            destination: '/',
            permanent: false,
        },
    };
  }

  return {
    props: {
      user: JSON.parse(safeJsonStringify(user)),
      isLoggedIn: user.username === loggedInUser,
    },
  };
});

function ProfileAdminPage({ user, isLoggedIn }) {
  return (
    <Container>
      <GeneralUserAdminCard
        user={user}
      />
    </Container>
  );
}

ProfileAdminPage.propTypes = {
  user: PropTypes.object.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
};

export default ProfileAdminPage;
